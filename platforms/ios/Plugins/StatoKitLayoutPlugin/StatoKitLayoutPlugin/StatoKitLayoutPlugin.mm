/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#if FB_SONARKIT_ENABLED

#import "StatoKitLayoutPlugin.h"

#import <StatoKit/StatoClient.h>
#import <StatoKit/StatoConnection.h>
#import <StatoKit/StatoResponder.h>
#import <StatoKit/SKMacros.h>
#import "SKDescriptorMapper.h"
#import "SKNodeDescriptor.h"
#import "SKTapListener.h"
#import "SKTapListenerImpl.h"
#import "SKSearchResultNode.h"
#import <mutex>

@implementation StatoKitLayoutPlugin
{

  NSMapTable<NSString *, id> *_trackedObjects;
  NSString *_lastHighlightedNode;
  NSMutableSet *_invalidObjects;
  Boolean _invalidateMessageQueued;
  NSDate *_lastInvalidateMessage;
  std::mutex invalidObjectsMutex;

  id<NSObject> _rootNode;
  id<SKTapListener> _tapListener;

  id<StatoConnection> _connection;

  NSMutableSet *_registeredDelegates;
}

- (instancetype)initWithRootNode:(id<NSObject>)rootNode
            withDescriptorMapper:(SKDescriptorMapper *)mapper{
  return [self initWithRootNode: rootNode
                withTapListener: [SKTapListenerImpl new]
           withDescriptorMapper: mapper];
}

- (instancetype)initWithRootNode:(id<NSObject>)rootNode
                 withTapListener:(id<SKTapListener>)tapListener
            withDescriptorMapper:(SKDescriptorMapper *)mapper {
  if (self = [super init]) {
    _descriptorMapper = mapper;
    _trackedObjects = [NSMapTable strongToWeakObjectsMapTable];
    _lastHighlightedNode = nil;
    _invalidObjects = [NSMutableSet new];
    _invalidateMessageQueued = false;
    _lastInvalidateMessage = [NSDate date];
    _rootNode = rootNode;
    _tapListener = tapListener;

    _registeredDelegates = [NSMutableSet new];
    [SKInvalidation sharedInstance].delegate = self;
  }

  return self;
}

- (NSString *)identifier
{
  return @"Inspector";
}

- (void)didConnect:(id<StatoConnection>)connection {
  _connection = connection;

  [SKInvalidation enableInvalidations];

  // Run setup logic for each descriptor
  for (SKNodeDescriptor *descriptor in _descriptorMapper.allDescriptors) {
    [descriptor setUp];
  }

  // In order to avoid a retain cycle (Connection -> Block -> StatoKitLayoutPlugin -> Connection ...)
  __weak StatoKitLayoutPlugin *weakSelf = self;

  [connection receive:@"getRoot" withBlock:^(NSDictionary *params, id<StatoResponder> responder) {
    StatoPerformBlockOnMainThread(^{ [weakSelf onCallGetRoot: responder]; }, responder);
  }];
  
  [connection receive:@"getAllNodes" withBlock:^(NSDictionary *params, id<StatoResponder> responder) {
    StatoPerformBlockOnMainThread(^{ [weakSelf onCallGetAllNodesWithResponder: responder]; }, responder);
  }];

  [connection receive:@"getNodes" withBlock:^(NSDictionary *params, id<StatoResponder> responder) {
    StatoPerformBlockOnMainThread(^{ [weakSelf onCallGetNodes: params[@"ids"] withResponder: responder]; }, responder);
  }];

  [connection receive:@"setData" withBlock:^(NSDictionary *params, id<StatoResponder> responder) {
    StatoPerformBlockOnMainThread(^{
      [weakSelf onCallSetData: params[@"id"]
                 withPath: params[@"path"]
                  toValue: params[@"value"]
           withConnection: connection];
    }, responder);
  }];

  [connection receive:@"setHighlighted" withBlock:^(NSDictionary *params, id<StatoResponder> responder) {
    StatoPerformBlockOnMainThread(^{ [weakSelf onCallSetHighlighted: params[@"id"] withResponder: responder]; }, responder);
  }];

  [connection receive:@"setSearchActive" withBlock:^(NSDictionary *params, id<StatoResponder> responder) {
    StatoPerformBlockOnMainThread(^{ [weakSelf onCallSetSearchActive: [params[@"active"] boolValue] withConnection: connection]; }, responder);
  }];

  [connection receive:@"isSearchActive" withBlock:^(NSDictionary *params, id<StatoResponder> responder) {
    StatoPerformBlockOnMainThread(^{ [weakSelf onCallIsSearchActiveWithConnection: responder]; }, responder);
  }];

  [connection receive:@"isConsoleEnabled" withBlock:^(NSDictionary *params, id<StatoResponder> responder) {
    StatoPerformBlockOnMainThread(^{ [responder success: @{@"isEnabled": @NO}];}, responder);
  }];

  [connection receive:@"getSearchResults" withBlock:^(NSDictionary *params, id<StatoResponder> responder) {
    StatoPerformBlockOnMainThread(^{ [weakSelf onCallGetSearchResults: params[@"query"] withResponder: responder]; }, responder);
  }];
}

- (void)didDisconnect {
  // Clear the last highlight if there is any
  [self onCallSetHighlighted: nil withResponder: nil];
  // Disable search if it is active
  [self onCallSetSearchActive: NO withConnection: nil];
}

- (void)onCallGetRoot:(id<StatoResponder>)responder {
  const auto rootNode= [self getNode: [self trackObject: _rootNode]];

  [responder success: rootNode];
}

- (void)populateAllNodesFromNode:(nonnull NSString *)identifier inDictionary:(nonnull NSMutableDictionary<NSString*, NSDictionary*> *)mutableDict {
  NSDictionary *nodeDict = [self getNode:identifier];
  mutableDict[identifier] = nodeDict;
  NSArray *arr = nodeDict[@"children"];
  for (NSString *childIdentifier in arr) {
    [self populateAllNodesFromNode:childIdentifier inDictionary:mutableDict];
  }
  return;
}

- (void)onCallGetAllNodesWithResponder:(nonnull id<StatoResponder>)responder {
  NSMutableArray<NSDictionary*> *allNodes = @[].mutableCopy;
  NSString *identifier = [self trackObject: _rootNode];
  NSDictionary *rootNode = [self getNode: identifier];
  if (!rootNode) {
    return [responder error:@{@"error": [NSString stringWithFormat:@"getNode returned nil for the rootNode %@, while getting all the nodes", identifier]}];
  }
  [allNodes addObject:rootNode];
  NSMutableDictionary *allNodesDict = @{}.mutableCopy;
  [self populateAllNodesFromNode:identifier inDictionary:allNodesDict];
  [responder success:@{@"allNodes": @{@"rootElement": identifier, @"elements": allNodesDict}}];
}

- (void)onCallGetNodes:(NSArray<NSDictionary *> *)nodeIds withResponder:(id<StatoResponder>)responder {
  NSMutableArray<NSDictionary *> *elements = [NSMutableArray new];

  for (id nodeId in nodeIds) {
    const auto node = [self getNode: nodeId];
    if (node == nil) {
      continue;
    }
    [elements addObject: node];
  }

  [responder success: @{ @"elements": elements }];
}

- (void)onCallSetData:(NSString *)objectId
             withPath:(NSArray<NSString *> *)path
              toValue:(id<NSObject>)value
       withConnection:(id<StatoConnection>)connection {
  id node = [_trackedObjects objectForKey: objectId];
  if (node == nil) {
    SKLog(@"node is nil, trying to setData: \
          objectId: %@ \
          path: %@ \
          value: %@",
          objectId, path, value);
    return;
  }

  // Sonar sends nil/NSNull on some values when the text-field
  // is empty, disregard these changes otherwise we'll crash.
  if (value == nil || [value isKindOfClass: [NSNull class]]) {
    return;
  }

  SKNodeDescriptor *descriptor = [_descriptorMapper descriptorForClass: [node class]];

  NSString *dotJoinedPath = [path componentsJoinedByString: @"."];
  SKNodeUpdateData updateDataForPath = [[descriptor dataMutationsForNode: node] objectForKey: dotJoinedPath];
  if (updateDataForPath != nil) {
    updateDataForPath(value);
    [connection send: @"invalidate" withParams: @{ @"id": [descriptor identifierForNode: node] }];
  }
}

- (void)onCallGetSearchResults:(NSString *)query withResponder:(id<StatoResponder>)responder {
  const auto alreadyAddedElements = [NSMutableSet<NSString *> new];
  SKSearchResultNode *matchTree = [self searchForQuery:(NSString *)[query lowercaseString] fromNode:(id)_rootNode withElementsAlreadyAdded: alreadyAddedElements];

  [responder success: @{
                        @"results": [matchTree toNSDictionary] ?: [NSNull null],
                        @"query": query
                        }];
  return;
}

- (void)onCallSetHighlighted:(NSString *)objectId withResponder:(id<StatoResponder>)responder {
  if (_lastHighlightedNode != nil) {
    id lastHighlightedObject = [_trackedObjects objectForKey: _lastHighlightedNode];
    if (lastHighlightedObject == nil) {
      [responder error: @{ @"error": @"unable to get last highlighted object" }];
      return;
    }

    SKNodeDescriptor *descriptor = [self->_descriptorMapper descriptorForClass: [lastHighlightedObject class]];
    [descriptor setHighlighted: NO forNode: lastHighlightedObject];

    _lastHighlightedNode = nil;
  }

  if (objectId == nil || [objectId isKindOfClass:[NSNull class]]) {
    return;
  }

  id object = [_trackedObjects objectForKey: objectId];
  if (object == nil) {
    SKLog(@"tried to setHighlighted for untracked id, objectId: %@", objectId);
    return;
  }

  SKNodeDescriptor *descriptor = [self->_descriptorMapper descriptorForClass: [object class]];
  [descriptor setHighlighted: YES forNode: object];

  _lastHighlightedNode = objectId;
}

- (void)onCallSetSearchActive:(BOOL)active withConnection:(id<StatoConnection>)connection {
  if (active) {
    [_tapListener mountWithFrame: [[UIScreen mainScreen] bounds]];
    __block id<NSObject> rootNode = _rootNode;

    [_tapListener listenForTapWithBlock:^(CGPoint touchPoint) {
      SKTouch *touch =
        [[SKTouch alloc] initWithTouchPoint: touchPoint
                               withRootNode: rootNode
                       withDescriptorMapper: self->_descriptorMapper
                            finishWithBlock:^(NSArray<NSString *> *path) {
                              [connection send: @"select"
                                    withParams: @{ @"path": path }];
                            }];

      SKNodeDescriptor *descriptor = [self->_descriptorMapper descriptorForClass: [rootNode class]];
      [descriptor hitTest: touch forNode: rootNode];
    }];
  } else {
    [_tapListener unmount];
  }
}

- (void)onCallIsSearchActiveWithConnection:(id<StatoResponder>)responder {
  [responder success: @{ @"isSearchActive": @NO }];
}

- (void)invalidateNode:(id<NSObject>)node {
  SKNodeDescriptor *descriptor = [_descriptorMapper descriptorForClass: [node class]];
  if (descriptor == nil) {
    return;
  }

  NSString *nodeId = [descriptor identifierForNode: node];
  if (![_trackedObjects objectForKey: nodeId]) {
    return;
  }
  [descriptor invalidateNode: node];

  // Collect invalidate messages before sending in a batch
  std::lock_guard<std::mutex> lock(invalidObjectsMutex);
  [_invalidObjects addObject:nodeId];
  if (_invalidateMessageQueued) {
    return;
  }
  _invalidateMessageQueued = true;

  if (_lastInvalidateMessage.timeIntervalSinceNow < -1) {
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 500 * NSEC_PER_MSEC), dispatch_get_main_queue(), ^{
      [self reportInvalidatedObjects];
    });
  }
}

- (void)reportInvalidatedObjects {
  std::lock_guard<std::mutex> lock(invalidObjectsMutex);
  NSMutableArray *nodes = [NSMutableArray new];
  for (NSString *nodeId in self->_invalidObjects) {
   [nodes addObject: [NSDictionary dictionaryWithObject: nodeId forKey: @"id"]];
  }
  [self->_connection send: @"invalidate" withParams: [NSDictionary dictionaryWithObject: nodes forKey: @"nodes"]];
  self->_lastInvalidateMessage = [NSDate date];
  self->_invalidObjects = [NSMutableSet new];
  self->_invalidateMessageQueued = false;
  return;
}

- (void)updateNodeReference:(id<NSObject>)node {
  SKNodeDescriptor *descriptor = [_descriptorMapper descriptorForClass: [node class]];
  if (descriptor == nil) {
    return;
  }

  NSString *nodeId = [descriptor identifierForNode: node];
  [_trackedObjects setObject:node forKey:nodeId];
}

- (SKSearchResultNode *)searchForQuery:(NSString *)query fromNode:(id)node withElementsAlreadyAdded:(NSMutableSet<NSString *> *)alreadyAdded {
  SKNodeDescriptor *descriptor = [_descriptorMapper descriptorForClass: [node class]];
  if (node == nil || descriptor == nil) {
    return nil;
  }

  NSMutableArray<SKSearchResultNode *> *childTrees = nil;
  BOOL isMatch = [descriptor matchesQuery: query forNode: node];

  NSString *nodeId = [self trackObject: node];

  for (auto i = 0; i < [descriptor childCountForNode: node]; i++) {
    id child = [descriptor childForNode: node atIndex: i];
    if (child) {
      SKSearchResultNode *childTree = [self searchForQuery: query fromNode: child withElementsAlreadyAdded:alreadyAdded];
      if (childTree != nil) {
        if (childTrees == nil) {
          childTrees = [NSMutableArray new];
        }
        [childTrees addObject: childTree];
      }
    }
  }

  if (isMatch || childTrees != nil) {

    NSDictionary *element = [self getNode: nodeId];
    if (nodeId == nil || element == nil) {
      return nil;
    }
    NSMutableArray<NSString *> *descriptorChildElements = [element objectForKey: @"children"];
    NSMutableDictionary *newElement = [element mutableCopy];

    NSMutableArray<NSString *> *childElementsToReturn = [NSMutableArray new];
    for (NSString *child in descriptorChildElements) {
      if (![alreadyAdded containsObject: child]) {
        [alreadyAdded addObject: child]; //todo add all at end
        [childElementsToReturn addObject: child];
      }
    }
    [newElement setObject: childElementsToReturn forKey: @"children"];
    return [[SKSearchResultNode alloc] initWithNode: nodeId
                                            asMatch: isMatch
                                        withElement: newElement
                                        andChildren: childTrees];
  }
  return nil;
}

- (NSDictionary *)getNode:(NSString *)nodeId {
  id<NSObject> node = [_trackedObjects objectForKey: nodeId];
  if (node == nil) {
    SKLog(@"node is nil, no tracked node found for nodeId: %@", nodeId);
    return nil;
  }

  SKNodeDescriptor *nodeDescriptor = [_descriptorMapper descriptorForClass: [node class]];
  if (nodeDescriptor == nil) {
    SKLog(@"No registered descriptor for class: %@", [node class]);
    return nil;
  }

  NSMutableArray *attributes = [NSMutableArray new];
  NSMutableDictionary *data = [NSMutableDictionary new];

  const auto *nodeAttributes = [nodeDescriptor attributesForNode: node];
  for (const SKNamed<NSString *> *namedPair in nodeAttributes) {
    const auto name = namedPair.name;
    if (name) {
      const NSDictionary *attribute = @{
                                        @"name": name,
                                        @"value": namedPair.value ?: [NSNull null],
                                        };
      [attributes addObject: attribute];
    }
  }

  const auto *nodeData = [nodeDescriptor dataForNode: node];
  for (const SKNamed<NSDictionary *> *namedPair in nodeData) {
    data[namedPair.name] = namedPair.value;
  }

  NSMutableArray *children = [NSMutableArray new];
  for (NSUInteger i = 0; i < [nodeDescriptor childCountForNode: node]; i++) {
    id childNode = [nodeDescriptor childForNode: node atIndex: i];

    NSString *childIdentifier = [self trackObject: childNode];
    if (childIdentifier) {
      [children addObject: childIdentifier];
    }
  }

  NSDictionary *nodeDic =
  @{
    // We shouldn't get nil for id/name/decoration, but let's not crash if we do.
    @"id": [nodeDescriptor identifierForNode: node] ?: @"(unknown)",
    @"name": [nodeDescriptor nameForNode: node] ?: @"(unknown)",
    @"children": children,
    @"attributes": attributes,
    @"data": data,
    @"decoration": [nodeDescriptor decorationForNode: node] ?: @"(unknown)",
    };

  return nodeDic;
}

- (NSString *)trackObject:(id)object {
  const SKNodeDescriptor *descriptor = [_descriptorMapper descriptorForClass: [object class]];
  NSString *objectIdentifier = [descriptor identifierForNode: object];

  if (objectIdentifier == nil) {
    return nil;
  }

  if (! [_trackedObjects objectForKey: objectIdentifier]) {
    [_trackedObjects setObject:object forKey:objectIdentifier];
  }

  return objectIdentifier;
}

- (BOOL)runInBackground {
  return true;
}

@end

#endif