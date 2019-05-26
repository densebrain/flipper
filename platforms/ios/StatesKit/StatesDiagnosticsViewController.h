/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#ifdef FB_SONARKIT_ENABLED

#include "StatesStateUpdateListener.h"
#import <UIKit/UIKit.h>

@interface StateTableDataSource : NSObject <UITableViewDataSource>
@property (strong, nonatomic) NSArray<NSDictionary *> *elements;
@end

@interface StatesDiagnosticsViewController : UIViewController<StatesStateUpdateListener>
@property(strong, nonatomic) StateTableDataSource *tableDataSource;
@property(strong, nonatomic) UILabel *stateLabel;
@property(strong, nonatomic) UITableView *stateTable;
@property(strong, nonatomic) UIScrollView *scrollView;
@property(strong, nonatomic) UILabel *logLabel;

- (void)onUpdate;
@end

#endif
