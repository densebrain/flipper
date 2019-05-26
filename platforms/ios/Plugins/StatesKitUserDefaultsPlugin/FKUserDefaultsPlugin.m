//
//  FKUserDefaultsPlugin.m
//  Sample
//
//  Created by Marc Terns on 9/30/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import "FKUserDefaultsPlugin.h"
#import <StatesKit/StatesConnection.h>
#import <StatesKit/StatesResponder.h>
#import "FKUserDefaultsSwizzleUtility.h"

@interface FKUserDefaultsPlugin ()
@property (nonatomic, strong) id<StatesConnection> statesConnection;
@property (nonatomic, strong) NSUserDefaults *userDefaults;
@property (nonatomic, copy) NSString *key;
@property (nonatomic, copy) NSString *suiteName;
@end

@implementation FKUserDefaultsPlugin

- (instancetype)initWithSuiteName:(NSString *)suiteName {
    if (self = [super init]) {
        _userDefaults = [NSUserDefaults standardUserDefaults];
        _suiteName = suiteName;
        __weak typeof(self) weakSelf = self;
        [FKUserDefaultsSwizzleUtility swizzleSelector:@selector(setObject:forKey:) class:[NSUserDefaults class] block:^(NSInvocation * _Nonnull invocation) {
            __unsafe_unretained id firstArg = nil;
            __unsafe_unretained id secondArg = nil;
            [invocation getArgument:&firstArg atIndex:2];
            [invocation getArgument:&secondArg atIndex:3];
            [invocation invoke];
            [weakSelf userDefaultsChangedWithValue:firstArg key:secondArg];
        }];
    }
    return self;
        
}

- (void)didConnect:(id<StatesConnection>)connection {
    self.statesConnection = connection;
    [connection receive:@"getAllSharedPreferences" withBlock:^(NSDictionary *params, id<StatesResponder> responder) {
        NSDictionary *userDefaults = @{
                                       @"Standard UserDefaults": [self.userDefaults dictionaryRepresentation]
                                       };
        [responder success: userDefaults];
    }];
    
    [connection receive:@"getSharedPreferences" withBlock:^(NSDictionary *params, id<StatesResponder> responder) {
        [responder success:[self.userDefaults dictionaryRepresentation]];
    }];
    
    [connection receive:@"setSharedPreference" withBlock:^(NSDictionary *params , id<StatesResponder> responder) {
        NSString *preferenceName = params[@"preferenceName"];
        [self.userDefaults setObject:params[@"preferenceValue"] forKey:preferenceName];
        [responder success:[self.userDefaults dictionaryRepresentation]];
    }];
}

- (void)didDisconnect {
    self.statesConnection = nil;
}

- (NSString *)identifier {
    return @"Preferences";
}

#pragma mark - Private methods

- (void)userDefaultsChangedWithValue:(id)value key:(NSString *)key {
    NSTimeInterval interval = [[NSDate date] timeIntervalSince1970] * 1000;
    NSString *intervalStr = [NSString stringWithFormat:@"%f", interval];
    NSMutableDictionary *params = [@{@"name":key,
                                    @"time":intervalStr
                                    } mutableCopy];
    
    if (!value) {
        [params setObject:@"YES" forKey:@"deleted"];
    } else {
        [params setObject:value forKey:@"value"];
    }
    [params setObject:@"Standard UserDefaults" forKey:@"preferences"];
    [self.statesConnection send:@"sharedPreferencesChange" withParams:[params copy]];
}

@end
