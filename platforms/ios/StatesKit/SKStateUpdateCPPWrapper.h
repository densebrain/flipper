#ifdef FB_SONARKIT_ENABLED

#include <States/StatesStateUpdateListener.h>
#import "StatesStateUpdateListener.h"

/*
 * This class exists to bridge the gap between Objective C and C++.
 * A SKStateUpdateCPPWrapper instance allows for wrapping an Objective-C object
 * and passing it to the pure C++ SonarClient, so it can be triggered when updates occur.
 */
class SKStateUpdateCPPWrapper : public StatesStateUpdateListener {
public:
  SKStateUpdateCPPWrapper(id<StatesStateUpdateListener> delegate_);
  void onUpdate();
private:
  __weak id<StatesStateUpdateListener> delegate_;
};

#endif
