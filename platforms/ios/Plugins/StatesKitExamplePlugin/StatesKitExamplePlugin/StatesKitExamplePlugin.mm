/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

#if FB_SONARKIT_ENABLED
#import "StatesKitExamplePlugin.h"
#import <StatesKit/StatesClient.h>
#import <StatesKit/StatesConnection.h>
#import <StatesKit/StatesResponder.h>

@interface StatesKitExamplePlugin()
@property (strong, nonatomic) id<StatesConnection> connection;
@property (nonatomic) NSInteger triggerCount;

@end

@implementation StatesKitExamplePlugin

- (instancetype)init {
    if (self = [super init]) {
        _triggerCount = 0;
    }
    return self;
}

+ (instancetype)sharedInstance {
    static StatesKitExamplePlugin *sInstance = nil;
    
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sInstance = [StatesKitExamplePlugin new];
    });
    
    return sInstance;
}

- (void)didConnect:(id<StatesConnection>)connection {
    __weak StatesKitExamplePlugin *weakSelf = self;
    self.connection = connection;
    [connection receive:@"displayMessage" withBlock:^(NSDictionary *params, id<StatesResponder> responder) {
        [weakSelf.delegate messageReceived:params[@"message"]];
        [responder success:@{@"greeting": @"Hello"}];
    }];
}

- (void)didDisconnect {
    self.connection = nil;
}

- (NSString *)identifier {
    return @"Example";
}

- (BOOL)runInBackground {
    return YES;
}

- (void)sendMessage:(NSString *)msg {
    [self.connection send:@"displayMessage" withParams:@{@"msg": msg}];
}

- (void)triggerNotification {
    [self.connection send:@"triggerNotification" withParams:@{@"id": @(self.triggerCount)}];
    self.triggerCount++;
}

@end

#endif
