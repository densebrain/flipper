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

#import <Stato/StatoPlugin.h>
#import <StatoKit/CppBridge/StatoCppBridgingConnection.h>
#import <StatoKit/StatoPlugin.h>

namespace facebook {
namespace stato {

using ObjCPlugin = NSObject<StatoPlugin> *;

/**
SonarCppWrapperPlugin is a simple C++ wrapper around Objective-C Sonar plugins
that can be passed to SonarClient. This class allows developers to write pure
Objective-C plugins if they want.
*/
class StatoCppWrapperPlugin final : public facebook::stato::StatoPlugin {
public:
  // Under ARC copying objCPlugin *does* increment its retain count
  StatoCppWrapperPlugin(ObjCPlugin objCPlugin) : _objCPlugin(objCPlugin) {}

  std::string identifier() const override { return [[_objCPlugin identifier] UTF8String]; }

  void didConnect(std::shared_ptr<facebook::stato::StatoConnection> conn) override
  {
    StatoCppBridgingConnection *const bridgingConn = [[StatoCppBridgingConnection alloc] initWithCppConnection:conn];
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

} // namespace stato
} // namespace facebook
