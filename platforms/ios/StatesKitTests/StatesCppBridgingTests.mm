/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#import <XCTest/XCTest.h>

#if FB_SONARKIT_ENABLED

#import <StatesKit/CppBridge/StatesCppWrapperPlugin.h>
#import <StatesKit/StatesPlugin.h>

using facebook::states::StatesCppWrapperPlugin;

@interface DummyPlugin : NSObject <StatesPlugin>
@end

@implementation DummyPlugin
- (NSString *)identifier { return @"Dummy"; }
- (void)didConnect:(id<StatesConnection>)connection {}
- (void)didDisconnect {}
@end

@interface StatesCppBridgingTests : XCTestCase
@end

@implementation StatesCppBridgingTests

- (void)testCppWrapperRetainsObjCPlugin {
  NSObject<StatesPlugin> *dummyPlugin = [DummyPlugin new];
  auto retainCountBefore = CFGetRetainCount((void *)dummyPlugin);
  StatesCppWrapperPlugin wrapperPlugin(dummyPlugin);
  auto retainCountAfter = CFGetRetainCount((void *)dummyPlugin);
  XCTAssertTrue(retainCountAfter > retainCountBefore);
}

@end

#endif
