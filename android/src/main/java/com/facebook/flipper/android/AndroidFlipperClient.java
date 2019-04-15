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

import javax.annotation.Nullable;
import java.net.*;
import java.util.*;
import java.util.concurrent.*;

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

  private static Builder builder = null;

  public static FlipperClient getClient() {
    return sClient;
  }

  private static synchronized FlipperClient createClient(
    @NotNull
    Context context,
    @NotNull
    FlipperAddress address,
    @NotNull
    String rootDir
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
    if (isRunningOnGenymotion()) {
      // Genymotion already has a friendly name by default
      return Build.MODEL;
    } else {
      return Build.MODEL + " - " + Build.VERSION.RELEASE + " - API " + Build.VERSION.SDK_INT;
    }
  }

  @SuppressLint("MissingPermission")
  static String getServerHost(Context context) {
    if (isRunningOnStockEmulator() && Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
      // adb reverse was added in lollipop, so before this
      // hard code host ip address.
      // This means it will only work on emulators, not physical devices.
      return "10.0.2.2";
    } else if (isRunningOnGenymotion()) {
      // This is hand-wavy but works on but ipv4 and ipv6 genymotion
      final WifiManager wifi = (WifiManager) context.getSystemService(Context.WIFI_SERVICE);
      final WifiInfo info = wifi.getConnectionInfo();
      final int ip = info.getIpAddress();
      return String.format(Locale.getDefault(), "%d.%d.%d.2", (ip & 0xff), (ip >> 8 & 0xff), (ip >> 16 & 0xff));
    } else {
      // Running on physical device or modern stock emulator.
      // Flipper desktop will run `adb reverse` to forward the ports.
      return "localhost";
    }
  }

  static String getRunningAppName(Context context) {
    return context.getApplicationInfo().loadLabel(context.getPackageManager()).toString();
  }

  static String getPackageName(@NotNull Context context) {
    return context.getPackageName();
  }

  public static final class Builder {

    private final static Object mainMutex = new Object();
    private final static ExecutorService worker = Executors.newSingleThreadExecutor();

    private Handler mainHandler;
    private List<FlipperPlugin> plugins = new ArrayList<FlipperPlugin>();
    private OnReadyCallback onReady;
    private Context context;
    private int insecurePort = FlipperProps.getInsecurePort();
    private int securePort = FlipperProps.getSecurePort();
    private FlipperAddress address;
    private String host, defaultHost;

    private String rootDir;

    private MDNS mdns;

    private Disposable mdnsListener;

    private Set<FlipperAddress> discoveredAddresses = new HashSet<>();

    private Runnable connectRunnable = new Runnable() {
      @Override
      public void run() {
        try {
          FlipperClient client = sClient = createClient(context, address, rootDir);
          for (FlipperPlugin plugin : plugins) {
            client.addPlugin(plugin);
          }
          if (onReady != null)
            onReady.call(client);

          client.start();
        } catch (Throwable ex) {
          Log.e(TAG, "Unable to connect", ex);
        } finally {
          synchronized (mainMutex) {
            mainMutex.notify();
          }
        }
      }
    };

    public Builder(Context context) throws Exception {
      if (builder != null) {
        throw new Exception("Builder already created");
      }

      builder = this;


      this.rootDir = context.getFilesDir().getAbsolutePath();
      this.mainHandler = new Handler(context.getMainLooper());
      this.context = context;
      this.host = this.defaultHost = getServerHost(context);

      // Above SDK 21 - use MDNS
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        this.mdns = new MDNS(context);

        mdnsListener = mdns.scan("_fbflipper._tcp").subscribe(
          new Consumer<NsdServiceInfo>() {
            @Override
            public void accept(NsdServiceInfo service) throws Exception {
              String host = service.getHost().getHostAddress();
              Map<String,byte[]> attrs = service.getAttributes();
              List<String> requiredAttrs = Arrays.asList("insecurePort","securePort");
              if (!attrs.keySet().containsAll(requiredAttrs)) {
                Log.e(TAG, "Required attributes are missing");
                return;
              }

              int insecurePort = Integer.parseInt(new String(Objects.requireNonNull(attrs.get("insecurePort"))));
              int securePort = Integer.parseInt(new String(Objects.requireNonNull(attrs.get("securePort"))));
              FlipperAddress address = new FlipperAddress(host,insecurePort,securePort);
              //String address = host + ":" + port;
              if (address.isValid()) { // !discoveredAddresses.contains(address)
                Log.i(TAG, "Found address: " + address);
                discoveredAddresses.add(address);
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


    public Builder withRootDir(String rootDir) {
      this.rootDir = rootDir;
      return this;
    }

    public Builder withHost(String host) {
      this.host = host;
      return this;
    }

    public Builder withInsecurePort(int insecurePort) {
      this.insecurePort = insecurePort;
      return this;
    }

    public Builder withSecurePort(int securePort) {
      this.securePort = securePort;
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

    private boolean testConnection(FlipperAddress address) {
      String host = address.host;
      for (int port : Arrays.asList(address.insecurePort,address.securePort)) {
        Socket socket = null;

        Log.i(TAG, String.format(Locale.getDefault(), "Connecting to [%s:%d]", host, port));
        try {
          InetAddress inetAddress = Inet4Address.getByName(host);
          socket = new Socket(inetAddress, port);
          if (socket.isConnected())
            return true;

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
      return false;
    }


    public Future<FlipperClient> start() {
      return worker.submit(new Callable<FlipperClient>() {
        @Override
        public FlipperClient call() throws Exception {
          while (true) {
            FlipperAddress address = null;
            if (discoveredAddresses.size() > 0) {
              address = discoveredAddresses.iterator().next();
            }

            if (address == null || !address.isValid()) {
              List<FlipperAddress> addresses = new ArrayList<>();
              for (String host : new String[]{host, defaultHost}) {
                addresses.add(new FlipperAddress(host,insecurePort, securePort));
              }


              for (FlipperAddress nextAddress : addresses) {
                if (testConnection(nextAddress)) {
                  address = nextAddress;
                  break;
                }
              }
            }

            if (address != null && address.isValid()) {
              Builder.this.address = address;
              synchronized (mainMutex) {
                mainHandler.post(connectRunnable);
                mainMutex.wait();
              }

              return sClient;
            }

            Thread.sleep(1000L);
          }
        }
      });
    }
  }

  private static class FlipperAddress {

    String host;
    int insecurePort;
    int securePort;

    boolean isValid() {
      return insecurePort > 0 && securePort > 0 && host != null;
    }

    FlipperAddress(String host, int insecurePort, int securePort) {
      this.host = host;
      this.insecurePort = insecurePort;
      this.securePort = securePort;

    }

    @Override
    public boolean equals(Object o) {
      if (this == o) return true;
      if (o == null || getClass() != o.getClass()) return false;
      FlipperAddress address = (FlipperAddress) o;
      return insecurePort == address.insecurePort &&
        securePort == address.securePort &&
        host.equals(address.host);
    }

    @Override
    public int hashCode() {
      return host.hashCode() + insecurePort + securePort;
    }

    @NotNull
    @Override
    public String toString() {
      return "FlipperAddress{" +
        "host='" + host + '\'' +
        ", insecurePort=" + insecurePort +
        ", securePort=" + securePort +
        '}';
    }
  }
}
