/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#import "AppDelegate.h"
#import <StatesKit/StatesClient.h>
#import <StatesKitLayoutPlugin/StatesKitLayoutPlugin.h>
#import <StatesKitNetworkPlugin/StatesKitNetworkPlugin.h>
#import <StatesKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <StatesKitLayoutComponentKitSupport/StatesKitLayoutComponentKitSupport.h>
#import <StatesKitExamplePlugin/StatesKitExamplePlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
#import <StatesKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>

#import "MainViewController.h"
#import "RootViewController.h"

#if !FB_SONARKIT_ENABLED
#error "Sample need to be run with SonarKit enabled in order to properly interact with Sonar. SonarKit is enabled by default if its a debug build."
#endif

@implementation AppDelegate {
  UIWindow *_window;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  _window = [[UIWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]];
  StatesClient *client = [StatesClient sharedClient];

  SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
  [StatesKitLayoutComponentKitSupport setUpWithDescriptorMapper: layoutDescriptorMapper];
  [client addPlugin: [[StatesKitLayoutPlugin alloc] initWithRootNode: application
                                               withDescriptorMapper: layoutDescriptorMapper]];

  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];

  [[StatesClient sharedClient] addPlugin: [[StatesKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
  [client addPlugin:[StatesKitExamplePlugin sharedInstance]];
  [client start];

  UIStoryboard *storyboard = [UIStoryboard storyboardWithName:@"MainStoryBoard" bundle:nil];
  MainViewController *mainViewController = [storyboard instantiateViewControllerWithIdentifier:@"MainViewController"];

  UINavigationController *navigationController = [[UINavigationController alloc] initWithRootViewController: mainViewController];
  navigationController.navigationBar.topItem.title = @"Sample";
  navigationController.navigationBar.translucent = NO;

  [_window setRootViewController: [[UINavigationController alloc] initWithRootViewController: mainViewController]];
  [_window makeKeyAndVisible];

  NSLog(@"Hello from States in an Objc app!");
  return YES;
}

@end
