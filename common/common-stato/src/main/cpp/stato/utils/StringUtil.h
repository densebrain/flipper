//
// Created by jglanz on 5/20/17.
//

#pragma once

#include <string>
#include <algorithm>

namespace stato {
  namespace util {

/**
 * String format
 */

    std::string replaceAll(const std::string &str, const std::string &replace, const std::string &with);

    std::string formatStr(const char *format, ...);

    int intFromHex(const char *pString);

    std::vector<std::string> tokenize(std::string str, std::string delim);

    inline bool endsWith(const std::string &str, const std::string &suffix) {
      auto length = str.length();
      auto index = str.find(suffix);
      return length - suffix.length() == index;
    }

    inline bool startsWith(const std::string &str, const std::string &prefix) { return str.find(prefix) == 0; }

    inline bool startsWith(std::string str, char value) { return str[0] == value; }

    inline std::string toLowerCase(const std::string &str) {
      auto lstr = str;
      std::transform(lstr.begin(), lstr.end(), lstr.begin(), ::tolower);
      return lstr;
    }


  }
}
