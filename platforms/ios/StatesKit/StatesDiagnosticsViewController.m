#ifdef FB_SONARKIT_ENABLED

#import "StatesDiagnosticsViewController.h"
#import "StatesClient.h"

#define STATE_VIEW_HEIGHT 300

static NSString *const kSKCellIdentifier = @"StatesDiagnosticStateTableStableCellIdentifier";

@implementation StateTableDataSource
- (instancetype)initWithElements:(NSArray<NSDictionary *> *)elements {
  self = [super init];
  if (self) {
    _elements = elements;
  }
  return self;
}

- (nonnull UITableViewCell *)tableView:(nonnull UITableView *)tableView cellForRowAtIndexPath:(nonnull NSIndexPath *)indexPath {
  NSInteger row = indexPath.row;

  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:kSKCellIdentifier forIndexPath:indexPath];
  cell.textLabel.font = [UIFont fontWithName:@"Arial" size:10];
  cell.textLabel.text = [self.elements[row][@"state"] stringByAppendingString:self.elements[row][@"name"]];
  return cell;
}

- (NSInteger)tableView:(nonnull UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
  return [self.elements count];
}

@end

@implementation StatesDiagnosticsViewController

- (void)viewDidLoad {
  [super viewDidLoad];

  self.scrollView = [[UIScrollView alloc] initWithFrame:CGRectMake(0, STATE_VIEW_HEIGHT, self.view.frame.size.width, self.view.frame.size.height - 100 - STATE_VIEW_HEIGHT)];
  self.logLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, self.view.frame.size.width, self.scrollView.frame.size.height)];
  self.logLabel.numberOfLines = 0;
  self.logLabel.font = [UIFont fontWithName:@"Arial" size:10];
  [self.scrollView addSubview:self.logLabel];

  self.stateTable = [[UITableView alloc] initWithFrame:CGRectMake(0, 0, self.view.bounds.size.width, STATE_VIEW_HEIGHT)];
  [self.stateTable registerClass:[UITableViewCell class] forCellReuseIdentifier:kSKCellIdentifier];
  self.stateTable.rowHeight = 14;
  self.tableDataSource = [[StateTableDataSource alloc] initWithElements:[[StatesClient sharedClient] getStateElements]];
  self.stateTable.dataSource = self.tableDataSource;

  [self updateLogView];

  [self.view addSubview:self.stateTable];
  [self.view addSubview:self.scrollView];
  self.view.backgroundColor = [UIColor whiteColor];
}

- (void)onUpdate {
  StatesDiagnosticsViewController __weak *weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    [weakSelf updateStateTable];
    [weakSelf updateLogView];
  });
}

- (void)updateStateTable {
  self.tableDataSource.elements = [[StatesClient sharedClient] getStateElements];
  [self.stateTable reloadData];
}

- (void)updateLogView {
  NSString *state = [[StatesClient sharedClient] getState];
  self.logLabel.text = state;
  [self.logLabel sizeToFit];
  self.scrollView.contentSize = self.logLabel.frame.size;

  // Scroll to bottom
  CGPoint bottomOffset = CGPointMake(0, self.scrollView.contentSize.height - self.scrollView.bounds.size.height);
  [self.scrollView setContentOffset:bottomOffset animated:YES];
}

- (void)viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];
  id<StatesStateUpdateListener> weakSelf = self;
  [[StatesClient sharedClient] subscribeForUpdates:weakSelf];
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations {
  return UIInterfaceOrientationMaskPortrait;
}

- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation {
  return UIInterfaceOrientationMaskPortrait;
}

@end

#endif
