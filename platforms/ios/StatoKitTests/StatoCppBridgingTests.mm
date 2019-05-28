/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#import <XCTest/XCTest.h>

#if FB_SONARKIT_ENABLED

#import <StatoKit/CppBridge/StatoCppWrapperPlugin.h>
#import <StatoKit/StatoPlugin.h>

using facebook::stato::StatoCppWrapperPlugin;

@interface DummyPlugin : NSObject <StatoPlugin>
@end

@implementation DummyPlugin
- (NSString *)identifier { return @"Dummy"; }
- (void)didConnect:(id<StatoConnection>)connection {}
- (void)didDisconnect {}
@end

@interface StatoCppBridgingTests : XCTestCase
@end

@implementation StatoCppBridgingTests

- (void)testCppWrapperRetainsObjCPlugin {
  NSObject<StatoPlugin> *dummyPlugin = [DummyPlugin new];
  auto retainCountBefore = CFGetRetainCount((void *)dummyPlugin);
  StatoCppWrapperPlugin wrapperPlugin(dummyPlugin);
  auto retainCountAfter = CFGetRetainCount((void *)dummyPlugin);
  XCTAssertTrue(retainCountAfter > retainCountBefore);
}

@end

#endif
