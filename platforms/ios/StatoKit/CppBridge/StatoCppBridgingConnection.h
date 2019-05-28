/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#import <Stato/StatoConnection.h>
#import <StatoKit/StatoConnection.h>

/**
StatoCppBridgingConnection is a simple ObjC wrapper around SonarConnection
that forwards messages to the underlying C++ connection. This class allows
pure Objective-C plugins to send messages to the underlying connection.
*/
@interface StatoCppBridgingConnection : NSObject <StatoConnection>
- (instancetype)initWithCppConnection:(std::shared_ptr<facebook::stato::StatoConnection>)conn;
@end
