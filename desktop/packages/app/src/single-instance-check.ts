

export default function checkSingleInstance(app: Electron.App, windowProvider: () => Electron.BrowserWindow | null): boolean {
  const gotTheLock = app.requestSingleInstanceLock()
  
  if (!gotTheLock) {
    app.quit()
    return false
  }
  app.on("second-instance", (_event, _commandLine, _workingDirectory) => {
    const win = windowProvider()
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) {
        win.restore()
      }
      
      win.focus()
    }
  }) // Create myWindow, load the rest of the app, etc...
   
   
   return true
}
