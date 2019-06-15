//
// Created by jglanz on 4/18/18.
//

#pragma once

#include <memory>
#include <mutex>

namespace stato {
  namespace utils {
    template<class T>
    class Singleton {
      public:
      static T *get() {
        static T gInstance;
        return &gInstance;
      };
    };
  }
}



