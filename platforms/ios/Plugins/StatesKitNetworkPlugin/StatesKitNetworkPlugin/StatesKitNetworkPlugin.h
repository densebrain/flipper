/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#if FB_SONARKIT_ENABLED
#import <Foundation/Foundation.h>

#import <StatesKit/StatesPlugin.h>

#import "SKBufferingPlugin.h"
#import "SKNetworkReporter.h"

@interface StatesKitNetworkPlugin : SKBufferingPlugin <SKNetworkReporterDelegate>

- (instancetype)initWithNetworkAdapter:(id<SKNetworkAdapterDelegate>)adapter NS_DESIGNATED_INITIALIZER;
- (instancetype)initWithNetworkAdapter:(id<SKNetworkAdapterDelegate>)adapter queue:(dispatch_queue_t)queue; //For test purposes

@property (strong, nonatomic) id<SKNetworkAdapterDelegate> adapter;

@end

#endif