/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#import <Stato/StatoResponder.h>
#import <StatoKit/StatoResponder.h>

/**
SonarCppBridgingResponder is a simple ObjC wrapper around StatoResponder
that forwards messages to the underlying C++ responder. This class allows
pure Objective-C plugins to send messages to the underlying responder.
*/
@interface StatoCppBridgingResponder : NSObject <StatoResponder>
- (instancetype)initWithCppResponder:(std::shared_ptr<facebook::stato::StatoResponder>)responder;
@end
