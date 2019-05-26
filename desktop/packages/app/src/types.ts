import * as Electron from "electron"

export interface DeepLink {
  url?: string | null | undefined
  file?: string | null | undefined
}

export interface MainState {
  win: Electron.BrowserWindow | null
  link: DeepLink | null
  options: StatesOptions
}
