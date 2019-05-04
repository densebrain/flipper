package com.facebook.flipper.android;


public class AndroidFlipperAddress {

  String host;
  int insecurePort;
  int securePort;

  boolean isValid() {
    return insecurePort > 0 && securePort > 0 && host != null;
  }

  AndroidFlipperAddress(String host, int insecurePort, int securePort) {
    this.host = host;
    this.insecurePort = insecurePort;
    this.securePort = securePort;

  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    AndroidFlipperAddress address = (AndroidFlipperAddress) o;
    return insecurePort == address.insecurePort &&
      securePort == address.securePort &&
      host.equals(address.host);
  }

  @Override
  public int hashCode() {
    return host.hashCode() + insecurePort + securePort;
  }

  @Override
  public String toString() {
    return "AndroidFlipperAddress{" +
      "host='" + host + '\'' +
      ", insecurePort=" + insecurePort +
      ", securePort=" + securePort +
      '}';
  }
}
