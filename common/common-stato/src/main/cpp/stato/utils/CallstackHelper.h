/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
//#if FB_SONARKIT_ENABLED
#if __ANDROID__
#include <dlfcn.h>
#include <unwind.h>
#include <iomanip>


namespace stato {
  namespace utils {
// TODO: T39093653, Replace the backtrace implementation with folly
// implementation. Didn't use the backtrace() c function as it was not found in
// NDK.

    _Unwind_Reason_Code unwindCallback(
      struct _Unwind_Context *context,
      void *arg);

    size_t captureBacktrace(void **buffer, size_t max);

    void dumpBacktrace(std::ostream &os, void **buffer, size_t count);

  }
} // namespace stato

#endif
//#endif
