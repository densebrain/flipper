export interface Chunk {
  id: any;
  ids: any;
  debugId: number;
  name: any;
  entryModule: any;
  files: any[];
  rendered: boolean;
  hash: any;
  renderedHash: any;
  chunkReason: any;
  extraAsync: boolean;
  
  hasRuntime(): boolean;
  canBeInitial(): boolean;
  isOnlyInitial(): boolean;
  hasEntryModule(): boolean;
  
  addModule(module: any): boolean;
  removeModule(module: any): boolean;
  setModules(modules: any): void;
  getNumberOfModules(): number;
  modulesIterable: any[];
  
  addGroup(chunkGroup: any): boolean;
  removeGroup(chunkGroup: any): boolean;
  isInGroup(chunkGroup: any): boolean;
  getNumberOfGroups(): number;
  groupsIterable: any[];
  
  compareTo(otherChunk: any): -1 | 0 | 1;
  containsModule(module: any): boolean;
  getModules(): any[];
  getModulesIdent(): any[];
  remove(reason: any): void;
  moveModule(module: any, otherChunk: any): void;
  integrate(otherChunk: any, reason: any): boolean;
  split(newChunk: any): void;
  isEmpty(): boolean;
  updateHash(hash: any): void;
  canBeIntegrated(otherChunk: any): boolean;
  addMultiplierAndOverhead(size: number, options: any): number;
  modulesSize(): number;
  size(options: any): number;
  integratedSize(otherChunk: any, options: any): number;
  // tslint:disable-next-line:ban-types
  sortModules(sortByFn: Function): void;
  getAllAsyncChunks(): Set<any>;
  getChunkMaps(realHash: any): { hash: any, name: any };
  // tslint:disable-next-line:ban-types
  getChunkModuleMaps(filterFn: Function): { id: any, hash: any };
  // tslint:disable-next-line:ban-types
  hasModuleInGraph(filterFn: Function, filterChunkFn: Function): boolean;
  toString(): string;
}

export type WebpackStatsAsset = {
  chunkNames:string[] // The chunks this asset contains
  chunks:number[] // The chunk IDs this asset contains
  emitted:boolean // Indicates whether or not the asset made it to the output directory
  name:string // The output filename
  size: () => number
}




export type WebpackAssetInfo = {
  name:string
  filename:string
  initial?: boolean | undefined | null
  chunk?: Chunk | undefined | null
  asset?: WebpackStatsAsset | undefined | null
}

export type WebpackOutputMap = {
  [name:string]:Array<WebpackAssetInfo>
}
