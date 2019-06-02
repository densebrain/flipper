
/**
 * String utilities
 */


#include <string>
#include <cstring>
#include <system_error>
#include <cstdarg>
#include <memory>
#include <cstdio>
#include <cassert>
#include <vector>
#include <stato/common/types.h>
#include <stato/utils/StringUtil.h>


namespace stato {
  namespace utils {

    using namespace std;

    std::string replaceAll(const std::string &str, const std::string &replace, const std::string &with) {
      ulong index;
      auto newStr = str;
      while ((index = newStr.find(replace)) != std::string::npos) {
        newStr.replace(index, replace.length(), with);
      }

      return newStr;
    }

    int intFromHex(const char *pString) {
      int val = 0;

      while (*pString != 0) {
        char ch = toupper(*pString++);
        assert((ch >= '0' && ch <= '9') || (ch >= 'A' && ch <= 'F'));
        int digit = (ch <= '9') ? (ch - '0') : (ch - 'A' + 10);
        val *= 16;
        val += digit;
      }

      return val;
    }

    std::string formatStr(const char *format, ...) {
      va_list args;
      va_start(args, format);
      int size = snprintf(nullptr, 0, format, args) + 1; // Extra space for '\0'
      std::unique_ptr<char[]> buf(new char[size]);
      vsnprintf(buf.get(), (size_t) size, format, args);
      va_end(args);
      return std::string(buf.get(), buf.get() + size - 1); // We don't want the '\0' inside

    }


    std::vector<std::string> tokenize(std::string srcStr, std::string delim) {
      char *token = nullptr;

      std::vector<char> str(srcStr.length());
      str.resize(srcStr.length());
      memcpy(str.data(), srcStr.c_str(), srcStr.length());

      char *p = str.data();

      std::vector<std::string> tokens;
      while (true) {
        token = strtok(token ? nullptr : p, delim.c_str());
        if (!token)
          break;

        tokens.emplace_back(token);

      }

      return tokens;


    }
  }
}
