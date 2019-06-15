/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#import <ComponentKit/CKStatelessComponent.h>
#import <StatoKit/SKMacros.h>

FB_LINK_REQUIRE_CATEGORY(CKStatelessComponent_Sonar)
@interface CKStatelessComponent (Sonar)

- (NSString *)sonar_componentNameOverride;

@end