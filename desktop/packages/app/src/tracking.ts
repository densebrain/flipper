
export default function enableTracking(windowProvider: () => Electron.BrowserWindow | null) {
  setInterval(() => {
    const win = windowProvider()
    if (win && win.isFocused()) {
      win.webContents.send("trackUsage")
    }
  }, 60 * 1000)
}
