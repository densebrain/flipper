package com.facebook.stato.nativeplugins;

public interface NativePlugin {
  String getTitle();

  RawNativePlugin asStatoPlugin();
}
