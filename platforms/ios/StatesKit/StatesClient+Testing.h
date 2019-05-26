/*
 *  Copyright (c) Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#ifndef __cplusplus
#error This header can only be included in .mm (ObjC++) files
#endif

#import <Foundation/Foundation.h>

#import <States/StatesClient.h>
#import <StatesKit/StatesClient.h>

@interface StatesClient (Testing)

- (instancetype)initWithCppClient:(facebook::states::StatesClient *)cppClient;

@end
