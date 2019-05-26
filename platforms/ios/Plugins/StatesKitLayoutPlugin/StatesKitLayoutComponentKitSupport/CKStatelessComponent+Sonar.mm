/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#if FB_SONARKIT_ENABLED

#import "CKStatelessComponent+Sonar.h"

#import <StatesKitLayoutPlugin/SKNamed.h>
#import <StatesKitLayoutPlugin/SKObject.h>

#import "CKComponent+Sonar.h"

FB_LINKABLE(CKStatelessComponent_Sonar)
@implementation CKStatelessComponent (Sonar)

- (NSString *)sonar_componentNameOverride
{
  return [self description];
}

@end

#endif
