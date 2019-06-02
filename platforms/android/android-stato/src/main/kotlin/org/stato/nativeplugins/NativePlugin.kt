package org.stato.nativeplugins

interface NativePlugin {
  val title: String

  fun asStatoPlugin(): RawNativePlugin
}
