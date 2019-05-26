/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#import <Foundation/Foundation.h>

#import <StatesKit/StatesResponder.h>

@interface StatesResponderMock : NSObject<StatesResponder>

@property (nonatomic, readonly) NSArray<NSDictionary *> *successes;
@property (nonatomic, readonly) NSArray<NSDictionary *> *errors;

@end
