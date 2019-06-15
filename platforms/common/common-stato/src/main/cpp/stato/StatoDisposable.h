//
// Created by Jonathan Glanz on 2019-06-13.
//

#pragma once

#include <memory>
#include <atomic>

namespace stato {

  using StatoDisposable = std::function<void()>;

  class StatoDisposer {
    public:
    StatoDisposer(const StatoDisposable & disposer) : disposer(disposer) {};

    void close() {
      if (!closed) {
        std::lock_guard<std::mutex> lock(mutex);
        if (!closed) {
          disposer();
          closed = true;
        }
      }
    };

    private:
    std::mutex mutex{};
    std::atomic_bool closed{false};
    StatoDisposable disposer;
  };

}