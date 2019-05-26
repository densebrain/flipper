/*
 *  Copyright (c) Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#import <Foundation/Foundation.h>

#import <StatesKit/StatesPlugin.h>

@protocol StatesConnection;

typedef void (^ConnectBlock)(id<StatesConnection>);
typedef void (^DisconnectBlock)();

@interface BlockBasedSonarPlugin : NSObject<StatesPlugin>

- (instancetype)initIdentifier:(NSString *)identifier connect:(ConnectBlock)connect disconnect:(DisconnectBlock)disconnect;
- (instancetype)initIdentifier:(NSString *)identifier connect:(ConnectBlock)connect disconnect:(DisconnectBlock)disconnect runInBackground:(BOOL)runInBackground;

@end
