package org.stato.android


data class AndroidStatoAddress (
  val host: String,
  val insecurePort: Int,
  val securePort: Int
) {

  internal val isValid: Boolean
    get() = insecurePort > 0 && securePort > 0 && host.isNotBlank()


}
