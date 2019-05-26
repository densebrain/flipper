/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#import <States/StatesConnection.h>
#import <StatesKit/StatesConnection.h>

/**
StatesCppBridgingConnection is a simple ObjC wrapper around SonarConnection
that forwards messages to the underlying C++ connection. This class allows
pure Objective-C plugins to send messages to the underlying connection.
*/
@interface StatesCppBridgingConnection : NSObject <StatesConnection>
- (instancetype)initWithCppConnection:(std::shared_ptr<facebook::states::StatesConnection>)conn;
@end
