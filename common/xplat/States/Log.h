#pragma once

#include <string>
#include <sstream>

#ifdef __ANDROID__

#include <android/log.h>

#endif

namespace facebook {
  namespace states {

    void log(const std::string &message);

    namespace logger {
      class LogStream {
      public:
        explicit LogStream(
#ifdef __ANDROID__
          android_LogPriority priority
#endif
        );

        ~LogStream();

#ifdef __ANDROID__


        inline android_LogPriority getPriority() {
          return priority;
        };
#endif

        void flush();

        template<typename T>
        LogStream &operator<<(const T &t) {
          ensureBuffer();
          (*buffer) << t;

          return *this;
        }

        LogStream &operator<<(const char *t);

        template<typename T>
        LogStream &operator<<(const std::string &t) {
          ensureBuffer();
          (*buffer) << t;

          return *this;
        };

      private:
        void ensureBuffer();

        std::ostringstream *buffer {NULL};

#ifdef __ANDROID__
        android_LogPriority priority;
#endif

      };

      LogStream &eol(LogStream &stream);

      void info(const std::string &message);

      void warn(const std::string &message);

      void error(const std::string &message);

      LogStream getLogStream(
#ifdef __ANDROID__
        android_LogPriority priority
#endif
        );

      inline LogStream debugStream() {
        return getLogStream(ANDROID_LOG_DEBUG);
      }

      inline LogStream infoStream() {
        return getLogStream(ANDROID_LOG_INFO);
      }

      inline LogStream warnStream() {
        return getLogStream(ANDROID_LOG_WARN);
      }

      inline LogStream errorStream() {
        return getLogStream(ANDROID_LOG_ERROR);
      }
    }
  } // namespace states
} // namespace facebook
