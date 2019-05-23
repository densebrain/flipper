import {getLogger, NotificationEvent, NotificationEvents} from "@flipper/common"
import * as Electron from "electron"

const
  {ipcMain} = Electron,
  log = getLogger(__filename)

const [s, ns] = process.hrtime()

let launchStartTime = s * 1e3 + ns / 1e6

log.info(`Started at: ${launchStartTime}`)

ipcMain.on("getLaunchTime", (event:Electron.Event) => {
  if (launchStartTime) {
    event.sender.send("getLaunchTime", launchStartTime)
    
    // set launchTime to null to only report it once, to prevents
    // reporting wrong
    // launch times for example after reloading the renderer process
    launchStartTime = null
  }
})

ipcMain.on("sendNotification", (e:any, {payload, pluginNotification, closeAfter}:any) => {
  log.debug("Received: sendNotification", payload, pluginNotification)
  // notifications can only be sent when app is ready
  
  const n = new Electron.Notification(payload) // Forwarding notification events to renderer process
  // https://electronjs.org/docs/api/notification#instance-events
  
  
  NotificationEvents
    .forEach((eventName:NotificationEvent) =>
      n.on(eventName as any, (_event:any, ...args:any) =>
        e.sender.send("notificationEvent", eventName, pluginNotification, ...args)
      )
    )
  
  n.show()
  
  if (closeAfter) {
    setTimeout(() => {
      n.close()
    }, closeAfter)
  }
  
}) // Define custom protocol handler. Deep linking works on packaged versions of the application!


export {}
