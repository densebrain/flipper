/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#ifdef FB_SONARKIT_ENABLED

#import <Foundation/Foundation.h>
#import "StatesPlugin.h"
#import "StatesStateUpdateListener.h"

/**
Represents a connection between the Sonar desktop och client side. Manages the lifecycle of attached
plugin instances.
*/
@interface StatesClient : NSObject

/**
The shared singleton StatesClient instance. It is an error to call this on non-debug builds to avoid leaking data.
*/
+ (instancetype)sharedClient;

/**
Register a plugin with the client.
*/
- (void)addPlugin:(NSObject<StatesPlugin> *)plugin;

/**
Unregister a plugin with the client.
*/
- (void)removePlugin:(NSObject<StatesPlugin> *)plugin;

/**
Retrieve the plugin with a given identifier which was previously registered with this client.
*/
- (NSObject<StatesPlugin> *)pluginWithIdentifier:(NSString *)identifier;

/**
Establish a connection to the Sonar desktop.
*/
- (void)start;

/**
Stop the connection to the Sonar desktop.
*/
- (void)stop;

/**
Get the log of state changes from the sonar client
*/
- (NSString *)getState;

/**
 Get the current summarized state of the sonar client
 */
- (NSArray<NSDictionary *> *)getStateElements;

/**
Subscribe a ViewController to state update change notifications
*/
- (void)subscribeForUpdates:(id<StatesStateUpdateListener>)controller;

// initializers are disabled. You must use `+[StatesClient sharedClient]` instance.
- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

@end

#endif
