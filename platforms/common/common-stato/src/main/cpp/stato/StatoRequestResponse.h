//
// Created by Jonathan Glanz on 2019-06-08.
//

#pragma once

#include <folly/dynamic.h>
#include <string>

namespace stato {

  struct StatoRequestResponse {
    std::string method {};
    std::string requestId {};
    std::string api {};
    std::string type {};
    bool isError {false};
  };
}