/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#import <XCTest/XCTest.h>

#if FB_SONARKIT_ENABLED

#import <StatesKit/StatesClient.h>

@interface StatesClientTests : XCTestCase
@end

@implementation StatesClientTests

- (void)testStartingClientDoesntCrashOrHang {
  StatesClient *client = [StatesClient sharedClient];
  [client start];
}

@end

#endif
