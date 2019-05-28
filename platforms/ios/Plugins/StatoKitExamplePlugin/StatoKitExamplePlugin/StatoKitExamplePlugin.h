/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#import <Foundation/Foundation.h>
#import <StatoKit/StatoPlugin.h>

@protocol StatoKitExampleCommunicationResponderDelegate
- (void)messageReceived:(NSString *)msg;
@end

@interface StatoKitExamplePlugin : NSObject<StatoPlugin>
@property (weak, nonatomic) id<StatoKitExampleCommunicationResponderDelegate> delegate;

- (instancetype)init NS_UNAVAILABLE;
- (void)sendMessage:(NSString *)msg;
- (void)triggerNotification;
+ (instancetype) sharedInstance;

@end
