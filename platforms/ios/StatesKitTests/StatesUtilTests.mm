/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

#import <XCTest/XCTest.h>
#if FB_SONARKIT_ENABLED

#import <StatesKit/StatesPlugin.h>
#import <StatesKit/StatesClient.h>
#import <StatesKit/StatesClient+Testing.h>
#import <StatesKit/StatesConnection.h>
#import <StatesKitTestUtils/BlockBasedSonarPlugin.h>
#import <StatesKitTestUtils/StatesResponderMock.h>
#import <StatesTestLib/StatesConnectionManagerMock.h>
#import <StatesTestLib/StatesPluginMock.h>
#import <folly/json.h>
#import <vector>

#import "StatesPlugin.h"

@interface StatesUtilTests : XCTestCase

@end

@implementation StatesUtilTests {
    StatesResponderMock *responder;
}


- (void)setUp {
    responder = [StatesResponderMock new];
}

- (void)testPerformOnMainThreadSuccess {
    StatesPerformBlockOnMainThread(^{}, responder);
    NSAssert([responder.successes count] == 0, @"No successes are output");
    NSAssert([responder.errors count] == 0, @"No errors are output");
}

- (void)testPerformOnMainThreadStdException {
    StatesPerformBlockOnMainThread(^{
        throw new std::exception();
    }, responder);
    NSAssert([responder.successes count] == 0, @"No successes are output");
    NSAssert([responder.errors count] == 1, @"1 error is output");
}

- (void)testPerformOnMainThreadNSException {
    StatesPerformBlockOnMainThread(^{
        NSArray *a = [NSArray init];
        [a objectAtIndex:1];
    }, responder);
    NSAssert([responder.successes count] == 0, @"No successes are output");
    NSAssert([responder.errors count] == 1, @"1 error is output");
}

@end
#endif
