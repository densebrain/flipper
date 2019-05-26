#ifdef FB_SONARKIT_ENABLED

#include "SKStateUpdateCPPWrapper.h"

SKStateUpdateCPPWrapper::SKStateUpdateCPPWrapper(id<StatesStateUpdateListener> controller) {
  delegate_ = controller;
}

void SKStateUpdateCPPWrapper::onUpdate() {
  if (!delegate_) {
    return;
  }
  [delegate_ onUpdate];
}

#endif
