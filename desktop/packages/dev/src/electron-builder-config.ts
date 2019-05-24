import {Configuration} from "electron-builder"

export default async function makeElectronBuilderConfig():Promise<Configuration> {
  return {
    "appId": "flipper",
    "productName": "Flipper",
    "artifactName": "Flipper-${os}.${ext}",
    "mac": {
      "category": "public.app-category.developer-tools",
      "extendInfo": {
        "NSUserNotificationAlertStyle": "alert"
      }
    },
    "win": {
      "publisherName": "Facebook, Inc."
    },
    "fileAssociations": [
      {
        "ext": [
          ".flipper"
        ],
        "name": "Flipper Data",
        "role": "Viewer",
        "icon": "document-icons/document.icns"
      }
    ]
  }
}
