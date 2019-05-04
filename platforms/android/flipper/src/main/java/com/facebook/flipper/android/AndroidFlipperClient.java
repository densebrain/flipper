/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 * <p>
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package com.facebook.flipper.android;

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

import com.facebook.flipper.core.FlipperClient;
import com.facebook.flipper.core.FlipperPlugin;

import io.reactivex.disposables.Disposable;
import io.reactivex.functions.Consumer;
import nz.co.cic.mdns.MDNS;

import org.jetbrains.annotations.NotNull;

import java.net.*;
import java.util.*;
import java.util.concurrent.*;

@SuppressWarnings("WeakerAccess")
public final class AndroidFlipperClient {

  private static String TAG = AndroidFlipperClient.class.getName();


  public static interface OnReadyCallback {
    void call(FlipperClient client);
  }

  private static boolean sIsInitialized = false;
  private static FlipperThread sFlipperThread;
  private static FlipperThread sConnectionThread;
  private static final String[] REQUIRED_PERMISSIONS =
    new String[]{"android.permission.INTERNET", "android.permission.ACCESS_WIFI_STATE"};

  private static FlipperClient sClient = null;

  public static FlipperClient getClient() {
    return sClient;
  }

  private static synchronized FlipperClient createClient(
    @NotNull Context context,
    @NotNull AndroidFlipperAddress address,
    @NotNull String rootDir
  ) {
    if (!sIsInitialized) {
      checkRequiredPermissions(context);
      sFlipperThread = new FlipperThread("FlipperEventBaseThread");
      sFlipperThread.start();
      sConnectionThread = new FlipperThread("FlipperConnectionThread");
      sConnectionThread.start();

      Log.i(TAG, "Connecting to address: " + address);
      final Context app =
        context.getApplicationContext() == null ? context : context.getApplicationContext();
      FlipperClientImpl.init(
        sFlipperThread.getEventBase(),
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
    return FlipperClientImpl.getInstance();
  }

  public static synchronized FlipperClient getInstanceIfInitialized() {
    if (!sIsInitialized) {
      return null;
    }
    return FlipperClientImpl.getInstance();
  }

  static void checkRequiredPermissions(Context context) {
    // Don't terminate for compatibility reasons. Not all apps have ACCESS_WIFI_STATE permission.
    for (String permission : REQUIRED_PERMISSIONS) {
      if (ContextCompat.checkSelfPermission(context, permission)
        == PackageManager.PERMISSION_DENIED) {
        Log.e(
          "Flipper",
          String.format("App needs permission \"%s\" to work with Flipper.", permission));
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
    // Flipper desktop will run `adb reverse` to forward the ports.
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

    private List<FlipperPlugin> plugins = new ArrayList<FlipperPlugin>();
    private OnReadyCallback onReady;
    private Context context;

    private AndroidFlipperAddress address, defaultAddress;


    private String rootDir;

    private MDNS mdns;

    private Disposable mdnsListener;

    private List<AndroidFlipperAddress> discoveredAddresses = new Vector<>();

    private FlipperClient connect(AndroidFlipperAddress address) {
      FlipperClient client = sClient = createClient(context, address, rootDir);
      for (FlipperPlugin plugin : plugins) {
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
      this.defaultAddress = new AndroidFlipperAddress(
        getServerHost(context),
        FlipperProps.getInsecurePort(),
        FlipperProps.getSecurePort());

      // Above SDK 21 - use MDNS
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        this.mdns = new MDNS(context);

        mdnsListener = mdns.scan("_fbflipper._tcp").subscribe(
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
                AndroidFlipperAddress address = new AndroidFlipperAddress(ip, insecurePort, securePort);
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

    public Builder withAddress(AndroidFlipperAddress address) {
      this.address = address;
      return this;
    }

    public Builder withDefaultAddress() {
      this.address = defaultAddress;
      return this;
    }

    public Builder withPlugins(FlipperPlugin... plugins) {
      this.plugins = Arrays.asList(plugins);
      return this;
    }

    public Builder withOnReady(OnReadyCallback onReady) {
      this.onReady = onReady;
      return this;
    }

    /**
     * Test flipper address
     *
     * @param address
     * @return
     */
    private boolean testAddress(AndroidFlipperAddress address) {
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


    public Future<FlipperClient> start() {
      return worker.submit(new Callable<FlipperClient>() {
        @Override
        public FlipperClient call() throws Exception {
          while (true) {
            AndroidFlipperAddress address = null;
            if (discoveredAddresses.size() > 0) {
              for (AndroidFlipperAddress nextAddress : discoveredAddresses) {
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
              Log.i(TAG, String.format("Using AndroidFlipperAddress: %s", address.toString()));
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
