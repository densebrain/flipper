package org.stato.core

open class StatoClientConfig(
  val callbackWorker: StatoEventBase,
  val connectionWorker: StatoEventBase,
  val insecurePort: Int,
  val securePort: Int,
  val host: String,
  val os: String,
  val device: String,
  val deviceId: String,
  val app: String,
  val appId: String,
  val privateAppDirectory: String
)