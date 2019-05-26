/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 * <p>
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package com.facebook.states.android;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.nsd.NsdServiceInfo;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Handler;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.facebook.states.core.StatesClient;
import com.facebook.states.core.StatesPlugin;

import io.reactivex.disposables.Disposable;
import io.reactivex.functions.Consumer;
import nz.co.cic.mdns.MDNS;

import org.jetbrains.annotations.NotNull;

import java.net.*;
import java.util.*;
import java.util.concurrent.*;

@SuppressWarnings("WeakerAccess")
public final class AndroidStatesClient {

  private static String TAG = AndroidStatesClient.class.getName();


  public static interface OnReadyCallback {
    void call(StatesClient client);
  }

  private static boolean sIsInitialized = false;
  private static StatesThread sStatesThread;
  private static StatesThread sConnectionThread;
  private static final String[] REQUIRED_PERMISSIONS =
    new String[]{"android.permission.INTERNET", "android.permission.ACCESS_WIFI_STATE"};

  private static StatesClient sClient = null;

  public static StatesClient getClient() {
    return sClient;
  }

  private static synchronized StatesClient createClient(
    @NotNull Context context,
    @NotNull AndroidStatesAddress address,
    @NotNull String rootDir
  ) {
    if (!sIsInitialized) {
      checkRequiredPermissions(context);
      sStatesThread = new StatesThread("StatesEventBaseThread");
      sStatesThread.start();
      sConnectionThread = new StatesThread("StatesConnectionThread");
      sConnectionThread.start();

      Log.i(TAG, "Connecting to address: " + address);
      final Context app =
        context.getApplicationContext() == null ? context : context.getApplicationContext();
      StatesClientImpl.init(
        sStatesThread.getEventBase(),
        sConnectionThread.getEventBase(),
        address.insecurePort,
        address.securePort,
        address.host,
        "Android",
        getFriendlyDeviceName(),
        getId(),
        getRunningAppName(app),
        getPackageName(app),
        rootDir);
      sIsInitialized = true;
    }
    return StatesClientImpl.getInstance();
  }

  public static synchronized StatesClient getInstanceIfInitialized() {
    if (!sIsInitialized) {
      return null;
    }
    return StatesClientImpl.getInstance();
  }

  static void checkRequiredPermissions(Context context) {
    // Don't terminate for compatibility reasons. Not all apps have ACCESS_WIFI_STATE permission.
    for (String permission : REQUIRED_PERMISSIONS) {
      if (ContextCompat.checkSelfPermission(context, permission)
        == PackageManager.PERMISSION_DENIED) {
        Log.e(
          "States",
          String.format("App needs permission \"%s\" to work with States.", permission));
      }
    }
  }

  static boolean isRunningOnGenymotion() {
    return Build.FINGERPRINT.contains("vbox");
  }

  static boolean isRunningOnStockEmulator() {
    return Build.FINGERPRINT.contains("generic") && !Build.FINGERPRINT.contains("vbox");
  }

  static String getId() {
    return Build.SERIAL;
  }

  static String getFriendlyDeviceName() {
    return (isRunningOnGenymotion()) ?
      // Genymotion already has a friendly name by default
      Build.MODEL :
      Build.MODEL + " - " + Build.VERSION.RELEASE + " - API " + Build.VERSION.SDK_INT;
  }

  @SuppressLint("MissingPermission")
  static String getServerHost(Context context) {
    if (isRunningOnStockEmulator() && Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
      // adb reverse was added in lollipop, so before this
      // hard code host ip address.
      // This means it will only work on emulators, not physical devices.
      return "10.0.2.2";
    } else if (isRunningOnGenymotion()) {
      try {
        // This is hand-wavy but works on but ipv4 and ipv6 genymotion
        final WifiManager wifi = (WifiManager) context.getSystemService(Context.WIFI_SERVICE);
        final WifiInfo info = wifi.getConnectionInfo();
        final int ip = info.getIpAddress();
        return String.format(Locale.getDefault(), "%d.%d.%d.2", (ip & 0xff), (ip >> 8 & 0xff), (ip >> 16 & 0xff));
      } catch (Throwable cause) {
        Log.e(TAG, "Unable to get wifi state", cause);
      }
    }

    // Running on physical device or modern stock emulator.
    // States desktop will run `adb reverse` to forward the ports.
    return "localhost";
  }

  static String getRunningAppName(Context context) {
    return context.getApplicationInfo().loadLabel(context.getPackageManager()).toString();
  }

  static String getPackageName(@NotNull Context context) {
    return context.getPackageName();
  }

  public static final class Builder {

    private final static ExecutorService worker = Executors.newSingleThreadExecutor();

    private List<StatesPlugin> plugins = new ArrayList<StatesPlugin>();
    private OnReadyCallback onReady;
    private Context context;

    private AndroidStatesAddress address, defaultAddress;


    private String rootDir;

    private MDNS mdns;

    private Disposable mdnsListener;

    private List<AndroidStatesAddress> discoveredAddresses = new Vector<>();

    private StatesClient connect(AndroidStatesAddress address) {
      StatesClient client = sClient = createClient(context, address, rootDir);
      for (StatesPlugin plugin : plugins) {
        client.addPlugin(plugin);
      }
      if (onReady != null)
        onReady.call(client);

      client.start();
      return client;
    }

    public Builder(Context context) {

      this.rootDir = context.getFilesDir().getAbsolutePath();
      this.context = context;
      this.defaultAddress = new AndroidStatesAddress(
        getServerHost(context),
        StatesProps.getInsecurePort(),
        StatesProps.getSecurePort());

      // Above SDK 21 - use MDNS
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        this.mdns = new MDNS(context);

        mdnsListener = mdns.scan("_fbstates._tcp").subscribe(
          new Consumer<NsdServiceInfo>() {
            @Override
            public void accept(NsdServiceInfo service) throws Exception {

              Map<String, byte[]> attrs = service.getAttributes();
              String[] ips = new String(Objects.requireNonNull(attrs.get("ips"))).split(",");
              for (String ip : ips) {
                List<String> requiredAttrs = Arrays.asList("insecurePort", "securePort");
                if (!attrs.keySet().containsAll(requiredAttrs)) {
                  Log.e(TAG, "Required attributes are missing");
                  continue;
                }

                int insecurePort = Integer.parseInt(new String(Objects.requireNonNull(attrs.get("insecurePort"))));
                int securePort = Integer.parseInt(new String(Objects.requireNonNull(attrs.get("securePort"))));
                AndroidStatesAddress address = new AndroidStatesAddress(ip, insecurePort, securePort);
                //String address = host + ":" + port;
                if (!discoveredAddresses.contains(address) && address.isValid()) { // !discoveredAddresses.contains(address)
                  Log.i(TAG, "Found address: " + address);
                  discoveredAddresses.add(address);
                }
              }
            }
          },
          new Consumer<Throwable>() {
            @Override
            public void accept(Throwable throwable) throws Exception {
              Log.e(TAG, "Error while scanning", throwable);
            }
          }
        );
      }
    }

    @Override
    protected void finalize() throws Throwable {
      try {
        if (mdnsListener != null && !mdnsListener.isDisposed())
          mdnsListener.dispose();
      } catch (Throwable ignored) {
      }
      super.finalize();
    }

    public Builder withRootDir(String rootDir) {
      this.rootDir = rootDir;
      return this;
    }

    public Builder withAddress(AndroidStatesAddress address) {
      this.address = address;
      return this;
    }

    public Builder withDefaultAddress() {
      this.address = defaultAddress;
      return this;
    }

    public Builder withPlugins(StatesPlugin... plugins) {
      this.plugins = Arrays.asList(plugins);
      return this;
    }

    public Builder withOnReady(OnReadyCallback onReady) {
      this.onReady = onReady;
      return this;
    }

    /**
     * Test states address
     *
     * @param address
     * @return
     */
    private boolean testAddress(AndroidStatesAddress address) {
      String host = address.host;
      for (int port : Arrays.asList(address.insecurePort, address.securePort)) {
        Socket socket = null;

        Log.i(TAG, String.format(Locale.getDefault(), "Connecting to [%s:%d]", host, port));
        try {
          InetAddress inetAddress = Inet4Address.getByName(host);
          socket = new Socket();
          socket.setSoTimeout(1000);
          socket.connect(new InetSocketAddress(inetAddress, port), 1000);
          if (socket.isConnected()) {
            return true;
          }
        } catch (Throwable err) {
          Log.e(TAG, String.format(Locale.getDefault(), "Unable to connect to %s:%d", host, port));
        } finally {
          try {
            if (socket != null)
              socket.close();
          } catch (Throwable ignored) {
          }
        }
      }
      Log.i(TAG, String.format(Locale.getDefault(), "Unable to connect to [%s]", address.host));
      return false;
    }


    public Future<StatesClient> start() {
      return worker.submit(new Callable<StatesClient>() {
        @Override
        public StatesClient call() throws Exception {
          while (true) {
            AndroidStatesAddress address = null;
            if (discoveredAddresses.size() > 0) {
              for (AndroidStatesAddress nextAddress : discoveredAddresses) {
                if (testAddress(nextAddress)) {
                  address = nextAddress;
                  break;
                }
              }
            }

            if (address == null && Builder.this.address != null && testAddress(Builder.this.address)) {
              address = Builder.this.address;
            }

            if (address != null && address.isValid()) {
              Log.i(TAG, String.format("Using AndroidStatesAddress: %s", address.toString()));
              try {
                return connect(address);
              } catch (Throwable ex) {
                Log.e(TAG, "Unable to connect", ex);
              }
            }

            Thread.sleep(1000L);
          }
        }
      });
    }
  }


}
