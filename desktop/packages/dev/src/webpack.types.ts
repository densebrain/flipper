export type WebpackStatsAsset = {
  chunkNames:string[] // The chunks this asset contains
  chunks:number[] // The chunk IDs this asset contains
  emitted:boolean // Indicates whether or not the asset made it to the output directory
  name:string // The output filename
  size: () => number
}

import * as webpack from "webpack"


export type WebpackAssetInfo = {
  name:string
  filename:string
  initial?: boolean | undefined | null
  chunk?: webpack.compilation.Chunk | undefined | null
  asset?: WebpackStatsAsset | undefined | null
}

export type WebpackOutputMap = {
  [name:string]:Array<WebpackAssetInfo>
}
