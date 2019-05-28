#ifdef FB_SONARKIT_ENABLED

#include <Stato/StatoStateUpdateListener.h>
#import "StatoStateUpdateListener.h"

/*
 * This class exists to bridge the gap between Objective C and C++.
 * A SKStateUpdateCPPWrapper instance allows for wrapping an Objective-C object
 * and passing it to the pure C++ SonarClient, so it can be triggered when updates occur.
 */
class SKStateUpdateCPPWrapper : public StatoStateUpdateListener {
public:
  SKStateUpdateCPPWrapper(id<StatoStateUpdateListener> delegate_);
  void onUpdate();
private:
  __weak id<StatoStateUpdateListener> delegate_;
};

#endif
