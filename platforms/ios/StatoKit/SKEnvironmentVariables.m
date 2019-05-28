#ifdef FB_SONARKIT_ENABLED

#import "SKEnvironmentVariables.h"

static int const DEFAULT_INSECURE_PORT = 8089;
static int const DEFAULT_SECURE_PORT = 8088;

@implementation SKEnvironmentVariables

+ (int)getInsecurePort {
    NSString *envVar = [self getStatoPortsVariable];
    return [self extractIntFromPropValue:envVar atIndex:0 withDefault:DEFAULT_INSECURE_PORT];
}
+ (int)getSecurePort {
    NSString *envVar = [self getStatoPortsVariable];
   return [self extractIntFromPropValue:envVar atIndex:1 withDefault:DEFAULT_SECURE_PORT];
}
+ (int)extractIntFromPropValue:(NSString *)propValue atIndex:(int)index withDefault:(int)fallback {
    NSArray<NSString *> *components = [propValue componentsSeparatedByString:@","];
    NSString *component = [components objectAtIndex:index];
    int envInt = [component intValue];
    return envInt > 0 ? envInt : fallback;
}
+ (NSString *)getStatoPortsVariable {
    NSString *value = NSProcessInfo.processInfo.environment[@"STATES_PORTS"];
    return value;
}
@end

#endif
