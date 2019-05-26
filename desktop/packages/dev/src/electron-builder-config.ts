import {Configuration} from "app-builder-lib"

export default async function makeElectronBuilderConfig():Promise<Configuration> {
  return {
    appId: "states",
    productName: "States",
    artifactName: "States-${os}.${ext}",
    mac: {
      publish: [
        "github"
      ],
      identity: "Densebrain, Inc",
      category: "public.app-category.developer-tools",
      extendInfo: {
        NSUserNotificationAlertStyle: "alert"
      }
    },
    win: {
      "publisherName": "Facebook, Inc."
    },
    fileAssociations: [
      {
        ext: [
          ".states"
        ],
        name: "States Data",
        role: "Viewer",
        icon: "build/document-icons/document.icns"
      }
    ]
  } as Configuration
}
