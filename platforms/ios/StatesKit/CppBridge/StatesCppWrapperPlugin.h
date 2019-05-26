/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#ifndef __OBJC__
#error This header can only be included in .mm (ObjC++) files
#endif

#import <States/StatesPlugin.h>
#import <StatesKit/CppBridge/StatesCppBridgingConnection.h>
#import <StatesKit/StatesPlugin.h>

namespace facebook {
namespace states {

using ObjCPlugin = NSObject<StatesPlugin> *;

/**
SonarCppWrapperPlugin is a simple C++ wrapper around Objective-C Sonar plugins
that can be passed to SonarClient. This class allows developers to write pure
Objective-C plugins if they want.
*/
class StatesCppWrapperPlugin final : public facebook::states::StatesPlugin {
public:
  // Under ARC copying objCPlugin *does* increment its retain count
  StatesCppWrapperPlugin(ObjCPlugin objCPlugin) : _objCPlugin(objCPlugin) {}

  std::string identifier() const override { return [[_objCPlugin identifier] UTF8String]; }

  void didConnect(std::shared_ptr<facebook::states::StatesConnection> conn) override
  {
    StatesCppBridgingConnection *const bridgingConn = [[StatesCppBridgingConnection alloc] initWithCppConnection:conn];
    [_objCPlugin didConnect:bridgingConn];
  }

  void didDisconnect() override { [_objCPlugin didDisconnect]; }

  bool runInBackground() override {
    if ([_objCPlugin respondsToSelector:@selector(runInBackground)]) {
      return [_objCPlugin runInBackground];
    }
    return false;
  }

  ObjCPlugin getObjCPlugin() { return _objCPlugin; }

private:
  ObjCPlugin _objCPlugin;
};

} // namespace states
} // namespace facebook
