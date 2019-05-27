import {isMac} from "@stato/common"
import {exec} from "child_process"

export default function checkMacAppName() {
  if (isMac()) {
    // If we are running on macOS and the app is called Stato, we add a comment
    // with the old name, to make it findable via Spotlight using its old name.
    const APP_NAME = "Stato.app"
    const i = process.execPath.indexOf(`/${APP_NAME}/`)
    
    if (i > -1) {
      exec(`osascript -e 'on run {f, c}' -e 'tell app "Finder" to set comment of (POSIX file f as alias) to c' -e end "${process.execPath.substr(
        0,
        i)}/${APP_NAME}" "sonar"`)
    }
  }
}
