/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.jni

import com.facebook.jni.annotations.DoNotStrip
import com.facebook.soloader.SoLoader

/**
 * This object holds a native C++ member for hybrid Java/C++ objects.
 *
 *
 * NB: THREAD SAFETY
 *
 *
 * [.resetNative] deletes the corresponding native object synchronously on whatever thread
 * the method is called on. Otherwise, deletion will occur on the [DestructorThread] thread.
 */
@DoNotStrip
open class HybridData {

  @DoNotStrip

  private val mDestructor = Destructor(this)

  /**
   * N.B. Thread safety. If you call isValid from a different thread than [.resetNative]
   * then be sure to do so while synchronizing on the hybrid. For example:
   *
   * <pre>`
   * synchronized(hybrid) {
   * if (hybrid.isValid) {
   * // Do stuff.
   * }
   * }
  `</pre> *
   */
  val isValid: Boolean
    get() = mDestructor.mNativePointer != 0L

  /**
   * To explicitly delete the instance, call resetNative(). If the C++ instance is referenced after
   * this is called, a NullPointerException will be thrown. resetNative() may be called multiple
   * times safely. Because the [DestructorThread] also calls resetNative, the instance will
   * not leak if this is not called, but timing of deletion and the thread the C++ dtor is called on
   * will be at the whim of the Java GC. If you want to control the thread and timing of the
   * destructor, you should call resetNative() explicitly.
   */
  @Synchronized
  fun resetNative() {
    mDestructor.destruct()
  }

  class Destructor(referent: Any) : DestructorThread.Destructor(referent) {

    // Private C++ instance
    @DoNotStrip

    var mNativePointer: Long = 0


    override fun destruct() {
      // When invoked from the DestructorThread instead of resetNative,
      // the DestructorThread has exclusive ownership of the HybridData
      // so synchronization is not necessary.
      deleteNative(mNativePointer)
      mNativePointer = 0
    }

    companion object {
      @JvmStatic
      external fun deleteNative(pointer: Long)
    }

  }

  companion object {
    @JvmStatic
    external fun deleteNative(pointer: Long)
    init {
      SoLoader.loadLibrary("android-fbjni")
    }
  }
}
