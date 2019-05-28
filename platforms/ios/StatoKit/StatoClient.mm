/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#if FB_SONARKIT_ENABLED

#import "StatoClient.h"
#import "StatoCppWrapperPlugin.h"
#import <Stato/StatoClient.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/ScopedEventBaseThread.h>
#import <UIKit/UIKit.h>
#include "SKStateUpdateCPPWrapper.h"
#import "StatoDiagnosticsViewController.h"
#import "StatoClient+Testing.h"
#import "SKEnvironmentVariables.h"

#if !TARGET_OS_SIMULATOR
#import <FKPortForwarding/FKPortForwardingServer.h>
#endif

using WrapperPlugin = facebook::stato::StatoCppWrapperPlugin;

@implementation StatoClient {
  facebook::stato::StatoClient *_cppClient;
  folly::ScopedEventBaseThread sonarThread;
  folly::ScopedEventBaseThread connectionThread;
#if !TARGET_OS_SIMULATOR
 FKPortForwardingServer *_secureServer;
 FKPortForwardingServer *_insecureServer;
#endif
}

+ (instancetype)sharedClient
{
  static StatoClient *sharedClient = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    try {
      sharedClient = [[self alloc] init];
    } catch (const std::exception &e) {
      // fail.
      sharedClient = nil;
    }
  });
  return sharedClient;
}

- (instancetype)init
{
  if (self = [super init]) {
    UIDevice *device = [UIDevice currentDevice];
    NSString *deviceName = [device name];
    NSBundle *bundle = [NSBundle mainBundle];
    NSString *appName = [bundle objectForInfoDictionaryKey:(NSString *)kCFBundleNameKey];
    NSString *appId = [bundle bundleIdentifier];
    NSString *privateAppDirectory = NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES)[0];

    NSFileManager *manager = [NSFileManager defaultManager];

    if ([manager fileExistsAtPath:privateAppDirectory isDirectory:NULL] == NO &&
        ![manager createDirectoryAtPath:privateAppDirectory withIntermediateDirectories:YES attributes:nil error:nil]) {
      return nil;
    }

#if TARGET_OS_SIMULATOR
    deviceName = [NSString stringWithFormat:@"%@ %@", [[UIDevice currentDevice] model], @"Simulator"];
#endif

    static const std::string UNKNOWN = std::string("unknown");
    try {
      facebook::stato::StatoClient::init({
        {
          "localhost",
          "iOS",
          [deviceName UTF8String],
          UNKNOWN,
          [appName UTF8String] ?: UNKNOWN,
          [appId UTF8String] ?: UNKNOWN,
          [privateAppDirectory UTF8String],
        },
        sonarThread.getEventBase(),
        connectionThread.getEventBase(),
        [SKEnvironmentVariables getInsecurePort],
        [SKEnvironmentVariables getSecurePort]
      });
      _cppClient = facebook::stato::StatoClient::instance();
    } catch (const std::system_error &e) {
      // Probably ran out of disk space.
      return nil;
    }
  }
  return self;
}

- (void)refreshPlugins
{
  _cppClient->refreshPlugins();
}

- (void)addPlugin:(NSObject<StatoPlugin> *)plugin
{
  _cppClient->addPlugin(std::make_shared<WrapperPlugin>(plugin));
}

- (void)removePlugin:(NSObject<StatoPlugin> *)plugin
{
  _cppClient->removePlugin(std::make_shared<WrapperPlugin>(plugin));
}

- (NSObject<StatoPlugin> *)pluginWithIdentifier:(NSString *)identifier
{
  auto cppPlugin = _cppClient->getPlugin([identifier UTF8String]);
  if (auto wrapper = dynamic_cast<WrapperPlugin *>(cppPlugin.get())) {
    return wrapper->getObjCPlugin();
  }
  return nil;
}

- (void)start;
{
#if !TARGET_OS_SIMULATOR
  _secureServer = [FKPortForwardingServer new];
  [_secureServer forwardConnectionsFromPort:8088];
  [_secureServer listenForMultiplexingChannelOnPort:8078];
  _insecureServer = [FKPortForwardingServer new];
  [_insecureServer forwardConnectionsFromPort:8089];
  [_insecureServer listenForMultiplexingChannelOnPort:8079];
#endif
  _cppClient->start();
}


- (void)stop
{
  _cppClient->stop();
#if !TARGET_OS_SIMULATOR
  [_secureServer close];
  _secureServer = nil;
  [_insecureServer close];
  _insecureServer = nil;
#endif
}

- (NSString *)getState {
  return @(_cppClient->getState().c_str());
}

- (NSArray *)getStateElements {
  NSMutableArray<NSDictionary<NSString *, NSString *>*> *const array = [NSMutableArray array];

  for (facebook::stato::StateElement element: _cppClient->getStateElements()) {
    facebook::stato::State state = element.state_;
    NSString *stateString;
    switch (state) {
      case facebook::stato::in_progress:
        stateString = @"⏳ ";
        break;

      case facebook::stato::success:
        stateString = @"✅ ";
        break;

      case facebook::stato::failed:
        stateString = @"❌ ";
        break;

      default:
        stateString = @"❓ ";
        break;
    }
    [array addObject:@{
                       @"name": [NSString stringWithUTF8String:element.name_.c_str()],
                       @"state": stateString
                       }];
  }
  return array;
}

- (void)subscribeForUpdates:(id<StatoStateUpdateListener>)controller {
  auto stateListener = std::make_shared<SKStateUpdateCPPWrapper>(controller);
  _cppClient->setStateListener(stateListener);
}

@end

@implementation StatoClient (Testing)

- (instancetype)initWithCppClient:(facebook::stato::StatoClient *)cppClient {
    if (self = [super init]) {
        _cppClient = cppClient;
    }
    return self;
}

@end

#endif
