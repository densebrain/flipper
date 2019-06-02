/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package org.stato.android

import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.net.wifi.WifiManager
import android.os.Build.*
import android.util.Log

import androidx.core.content.ContextCompat
import com.facebook.soloader.SoLoader

import io.reactivex.disposables.Disposable
import nz.co.cic.mdns.MDNS
import org.stato.BuildConfig
import org.stato.core.*
import org.stato.core.StatoThread

import java.net.*
import java.util.*
import java.util.concurrent.*
import java.util.concurrent.atomic.AtomicReference

@SuppressWarnings("WeakerAccess")
object AndroidStatoClientManager {

  init {
    if (BuildConfig.IS_INTERNAL_BUILD) {
      SoLoader.loadLibrary("android-stato")
    }
  }

  private val TAG = AndroidStatoClientManager::class.java.name

  private val REQUIRED_PERMISSIONS = arrayOf(
    "android.permission.INTERNET",
    "android.permission.ACCESS_WIFI_STATE"
  )

  private val clientRef = AtomicReference<StatoClient?>(null)

  private lateinit var statoThread: StatoThread
  private lateinit var connectionThread: StatoThread


  val isInitialized
    get() = clientRef.get() != null

  val client: StatoClient?
    get() = clientRef.get()


  private val isRunningOnGenymotion: Boolean
    get() = FINGERPRINT.contains("vbox")

  private val isRunningOnStockEmulator: Boolean
    get() = "(generic|vbox)"
      .toRegex()
      .containsMatchIn(FINGERPRINT)


  @Suppress("DEPRECATION")
  private val id: String
    @SuppressLint("HardwareIds")
    get() = SERIAL

  // Genymotion already has a friendly name by default
  private val friendlyDeviceName: String
    get() = if (isRunningOnGenymotion)
      MODEL
    else
      "${MODEL} - ${VERSION.RELEASE} - API ${VERSION.SDK_INT}"


  interface OnReadyCallback {
    fun call(client: StatoClient)
  }

  @Synchronized
  private fun createClient(
    context: Context,
    address: AndroidStatoAddress,
    rootDir: String
  ): StatoClient {
    val client = StatoClientManager.getClient()
    if (!isInitialized) {
      checkRequiredPermissions(context)
      statoThread = StatoThread("StatoEventBaseThread")
      statoThread.start()
      connectionThread = StatoThread("StatoConnectionThread")
      connectionThread.start()

      Log.i(TAG, "Connecting to address: ${address}")
      val app = context.applicationContext ?: context

      client.init(StatoClientConfig(
        statoThread.acquireEventBase(),
        connectionThread.acquireEventBase(),
        address.insecurePort,
        address.securePort,
        address.host,
        "Android",
        friendlyDeviceName,
        id,
        getRunningAppName(app),
        getPackageName(app),
        rootDir
      ))

    }
    return client
  }

  internal fun checkRequiredPermissions(context: Context) {
    // Don't terminate for compatibility reasons. Not all apps have ACCESS_WIFI_STATE permission.
    for (permission in REQUIRED_PERMISSIONS) {
      if (ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_DENIED) {
        Log.e(
          "Stato",
          String.format("App needs permission \"%s\" to work with Stato.", permission))
      }
    }
  }

  @SuppressLint("MissingPermission")
  internal fun getServerHost(context: Context): String {
    // && Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP
    if (isRunningOnStockEmulator) {
      // adb reverse was added in lollipop, so before this
      // hard code host ip address.
      // This means it will only work on emulators, not physical devices.
      return "10.0.2.2"
    } else if (isRunningOnGenymotion) {
      try {
        // This is hand-wavy but works on but ipv4 and ipv6 genymotion
        val wifi = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        val info = wifi.connectionInfo
        val ip = info.ipAddress
        return String.format(Locale.getDefault(), "%d.%d.%d.2", ip and 0xff, ip shr 8 and 0xff, ip shr 16 and 0xff)
      } catch (cause: Throwable) {
        Log.e(TAG, "Unable to get wifi state", cause)
      }

    }

    // Running on physical device or modern stock emulator.
    // Stato desktop will run `adb reverse` to forward the ports.
    return "localhost"
  }

  private fun getRunningAppName(context: Context): String {
    return context.getApplicationInfo().loadLabel(context.getPackageManager()).toString()
  }

  private fun getPackageName(context: Context): String {
    return context.getPackageName()
  }

  class Builder(private val context: Context) {

    private var plugins = mutableListOf<StatoPlugin>()
    private var onReady: OnReadyCallback? = null

    private var address: AndroidStatoAddress? = null
    private val defaultAddress: AndroidStatoAddress = AndroidStatoAddress(
      getServerHost(context),
      AndroidStatoProps.insecurePort,
      AndroidStatoProps.securePort
    )


    private var rootDir: String = context.filesDir.absolutePath

    private var mdns: MDNS? = null

    private var mdnsListener: Disposable? = null

    private val discoveredAddresses = mutableSetOf<AndroidStatoAddress>()

    private fun connect(address: AndroidStatoAddress): StatoClient {
      val client = createClient(context, address, rootDir)
      AndroidStatoClientManager.clientRef.set(client)

      plugins.forEach(client::addPlugin)

      if (onReady != null)
        onReady!!.call(client)

      client.start()
      return client
    }

    init {


      // Above SDK 21 - use MDNS
      if (VERSION.SDK_INT >= VERSION_CODES.LOLLIPOP) {
        this.mdns = MDNS(context)

        mdnsListener = mdns!!.scan("_stato._tcp").subscribe(
          { service ->
            val attrs = service.attributes
            val ips = String(attrs["ips"]!!).split(",")
            for (ip in ips) {
              val requiredAttrs = Arrays.asList("insecurePort", "securePort")
              if (!attrs.keys.containsAll(requiredAttrs)) {
                Log.e(TAG, "Required attributes are missing")
                continue
              }

              val insecurePort = Integer.parseInt(String(attrs["insecurePort"]!!))
              val securePort = Integer.parseInt(String(attrs["securePort"]!!))
              val address = AndroidStatoAddress(ip, insecurePort, securePort)

              if (!discoveredAddresses.contains(address) && address.isValid) {
                Log.i(TAG, "Found address: $address")
                discoveredAddresses.add(address)
              }
            }
          },
          { throwable ->
            Log.e(TAG, "Error while scanning", throwable)
          }
        )
      }
    }

    protected fun finalize() {
      try {
        if (mdnsListener != null && !mdnsListener!!.isDisposed())
          mdnsListener!!.dispose()
      } catch (ignored: Throwable) {
      }
    }

    fun withRootDir(rootDir: String): Builder {
      this.rootDir = rootDir
      return this
    }

    fun withAddress(address: AndroidStatoAddress): Builder {
      this.address = address
      return this
    }

    fun withDefaultAddress(): Builder {
      this.address = defaultAddress
      return this
    }

    fun withPlugins(vararg plugins: StatoPlugin): Builder {
      this.plugins.addAll(plugins)
      return this
    }

    fun withOnReady(onReady: OnReadyCallback): Builder {
      this.onReady = onReady
      return this
    }

    /**
     * Test stato address
     *
     * @param address
     * @return
     */
    private fun testAddress(address: AndroidStatoAddress): Boolean {
      val host = address.host
      for (port in Arrays.asList(address.insecurePort, address.securePort)) {
        var socket: Socket? = null

        Log.i(TAG, String.format(Locale.getDefault(), "Connecting to [%s:%d]", host, port))
        try {
          val inetAddress = Inet4Address.getByName(host)
          socket = Socket()
          socket.soTimeout = 1000
          socket.connect(InetSocketAddress(inetAddress, port), 1000)
          if (socket.isConnected) {
            return true
          }
        } catch (err: Throwable) {
          Log.e(TAG, String.format(Locale.getDefault(), "Unable to connect to %s:%d", host, port))
        } finally {
          try {
            if (socket != null)
              socket!!.close()
          } catch (ignored: Throwable) {
          }

        }
      }
      Log.i(TAG, String.format(Locale.getDefault(), "Unable to connect to [%s]", address.host))
      return false
    }


    fun start(): Future<StatoClient> {
      return worker.submit(Callable<StatoClient> {
        lateinit var client: StatoClient
        while (true) {
          var address: AndroidStatoAddress? = null
          if (discoveredAddresses.size > 0) {
            for (nextAddress in discoveredAddresses) {
              if (testAddress(nextAddress)) {
                address = nextAddress
                break
              }
            }
          }

          if (address == null && this@Builder.address != null && testAddress(this@Builder.address!!)) {
            address = this@Builder.address
          }

          if (address != null && address.isValid) {
            Log.i(TAG, String.format("Using AndroidStatoAddress: %s", address!!.toString()))
            try {
              client = connect(address)
              break
            } catch (ex: Throwable) {
              Log.e(TAG, "Unable to connect", ex)
            }

          }

          Thread.sleep(1000L)
        }

        client
      })
    }

    companion object {

      private val worker = Executors.newSingleThreadExecutor()
    }
  }


}
