/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

#import <XCTest/XCTest.h>
#if FB_SONARKIT_ENABLED

#import <StatoKit/StatoPlugin.h>
#import <StatoKit/StatoClient.h>
#import <StatoKit/StatoClient+Testing.h>
#import <StatoKit/StatoConnection.h>
#import <StatoKitTestUtils/BlockBasedSonarPlugin.h>
#import <StatoKitTestUtils/StatoResponderMock.h>
#import <StatoTestLib/StatoConnectionManagerMock.h>
#import <StatoTestLib/StatoPluginMock.h>
#import <folly/json.h>
#import <vector>

#import "StatoPlugin.h"

@interface StatoUtilTests : XCTestCase

@end

@implementation StatoUtilTests {
    StatoResponderMock *responder;
}


- (void)setUp {
    responder = [StatoResponderMock new];
}

- (void)testPerformOnMainThreadSuccess {
    StatoPerformBlockOnMainThread(^{}, responder);
    NSAssert([responder.successes count] == 0, @"No successes are output");
    NSAssert([responder.errors count] == 0, @"No errors are output");
}

- (void)testPerformOnMainThreadStdException {
    StatoPerformBlockOnMainThread(^{
        throw new std::exception();
    }, responder);
    NSAssert([responder.successes count] == 0, @"No successes are output");
    NSAssert([responder.errors count] == 1, @"1 error is output");
}

- (void)testPerformOnMainThreadNSException {
    StatoPerformBlockOnMainThread(^{
        NSArray *a = [NSArray init];
        [a objectAtIndex:1];
    }, responder);
    NSAssert([responder.successes count] == 0, @"No successes are output");
    NSAssert([responder.errors count] == 1, @"1 error is output");
}

@end
#endif
