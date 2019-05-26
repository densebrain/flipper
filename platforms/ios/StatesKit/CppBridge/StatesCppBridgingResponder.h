/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#import <States/StatesResponder.h>
#import <StatesKit/StatesResponder.h>

/**
SonarCppBridgingResponder is a simple ObjC wrapper around StatesResponder
that forwards messages to the underlying C++ responder. This class allows
pure Objective-C plugins to send messages to the underlying responder.
*/
@interface StatesCppBridgingResponder : NSObject <StatesResponder>
- (instancetype)initWithCppResponder:(std::shared_ptr<facebook::states::StatesResponder>)responder;
@end
