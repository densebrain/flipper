//
//  FKUserDefaultsPlugin.h
//  Sample
//
//  Created by Marc Terns on 9/30/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <StatoKit/StatoPlugin.h>

NS_ASSUME_NONNULL_BEGIN

@interface FKUserDefaultsPlugin : NSObject <StatoPlugin>

- (instancetype)initWithSuiteName:(nullable NSString *)suiteName;
    
@end

NS_ASSUME_NONNULL_END
