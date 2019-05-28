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

#import <Stato/StatoClient.h>
#import <StatoKit/StatoClient.h>

@interface StatoClient (Testing)

- (instancetype)initWithCppClient:(facebook::stato::StatoClient *)cppClient;

@end
