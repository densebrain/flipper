//
// Created by Jonathan Glanz on 2019-06-02.
//
#include <stato/utils/CallstackHelper.h>

namespace stato {
  namespace utils {

    struct BacktraceState {
      void **current;
      void **end;
    };


    _Unwind_Reason_Code unwindCallback(
      struct _Unwind_Context *context,
      void *arg) {
      auto *state = static_cast<BacktraceState *>(arg);
      uintptr_t pc = _Unwind_GetIP(context);
      if (pc) {
        if (state->current == state->end) {
          return _URC_END_OF_STACK;
        } else {
          *state->current++ = reinterpret_cast<void *>(pc);
        }
      }
      return _URC_NO_REASON;
    }

    size_t captureBacktrace(void **buffer, size_t max) {
      BacktraceState state = {buffer, buffer + max};
      _Unwind_Backtrace(unwindCallback, &state);

      return state.current - buffer;
    }

    void dumpBacktrace(std::ostream &os, void **buffer, size_t count) {
      for (size_t idx = 0; idx < count; ++idx) {
        const void *addr = buffer[idx];
        const char *symbol = "";

        Dl_info info;
        if (dladdr(addr, &info) && info.dli_sname) {
          symbol = info.dli_sname;
        }

        os << "  #" << std::setw(2) << idx << ": " << addr << "  " << symbol
           << "\n";
      }
    }
  }
}