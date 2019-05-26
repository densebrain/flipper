package com.facebook.states.nativeplugins;

public interface NativePlugin {
  String getTitle();

  RawNativePlugin asStatesPlugin();
}
