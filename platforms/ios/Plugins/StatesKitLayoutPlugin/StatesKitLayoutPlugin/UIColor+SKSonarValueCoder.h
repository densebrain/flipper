/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#import <UIKit/UIKit.h>

#import <StatesKit/SKMacros.h>

#import "SKObject.h"

FB_LINK_REQUIRE_CATEGORY(UIColor_SonarValueCoder)
@interface UIColor (SonarValueCoder) <SKSonarValueCoder>

@end
