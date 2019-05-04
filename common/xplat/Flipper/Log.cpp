#include "Log.h"

#ifdef __ANDROID__

#include <android/log.h>

#endif

#define TAG "flipper"

namespace facebook {
  namespace flipper {

    void log(const std::string &message) {
#ifdef __ANDROID__
      __android_log_print(ANDROID_LOG_INFO, TAG, message.c_str());
#else
      printf("flipper: %s\n", message.c_str());
#endif
    }

    namespace logger {

      LogStream::LogStream(android_LogPriority priority) :
        std::stringstream(),
        priority(priority) {}

      LogStream::~LogStream() {
        flush();
      }

      LogStream &LogStream::operator<<(const char *t) {
        ensureBuffer();
        (*buffer) << t;
        return *this;
      }

      void LogStream::flush() {
        if (buffer) {
#ifdef __ANDROID__
          __android_log_print(priority, TAG, buffer->str().c_str());
#else
          printf("flipper: %s\n", buffer->str().c_str());
#endif
          delete buffer;
          buffer = NULL;

        }
      }

      void LogStream::ensureBuffer() {
        if (!buffer) {
          if (!(buffer = new std::ostringstream)) {
            // XXX help help help
          }
        }
      }


      void info(const std::string &message) {
#ifdef __ANDROID__
        __android_log_print(ANDROID_LOG_INFO, TAG, message.c_str());
#else
        printf("flipper: %s\n", message.c_str());
#endif
      }

      void warn(const std::string &message) {
#ifdef __ANDROID__
        __android_log_print(ANDROID_LOG_WARN, TAG, message.c_str());
#else
        printf("flipper: %s\n", message.c_str());
#endif
      }

      void error(const std::string &message) {
#ifdef __ANDROID__
        __android_log_print(ANDROID_LOG_ERROR, TAG, message.c_str());
#else
        printf("flipper: %s\n", message.c_str());
#endif
      }

      LogStream getLogStream(
#ifdef __ANDROID__
        android_LogPriority priority
#endif
      ) {
        return LogStream(
#ifdef __ANDROID__
          priority
#endif
        );
      }
    }


  } // namespace flipper
} // namespace facebook
