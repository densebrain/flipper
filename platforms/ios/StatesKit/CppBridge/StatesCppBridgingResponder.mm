/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#import "StatesCppBridgingResponder.h"

#import <FBCxxUtils/FBCxxFollyDynamicConvert.h>

@implementation StatesCppBridgingResponder {
  std::shared_ptr<facebook::states::StatesResponder> responder_;
}

- (instancetype)initWithCppResponder:(std::shared_ptr<facebook::states::StatesResponder>)responder
{
  if (!responder) {
    return nil;
  }

  if (self = [super init]) {
    responder_ = responder;
  }

  return self;
}

#pragma mark - StatesResponder

- (void)success:(NSDictionary *)response { responder_->success(facebook::cxxutils::convertIdToFollyDynamic(response, true)); }

- (void)error:(NSDictionary *)response { responder_->error(facebook::cxxutils::convertIdToFollyDynamic(response, true)); }

@end
