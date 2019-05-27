import {Configuration} from "app-builder-lib"

export default async function makeElectronBuilderConfig():Promise<Configuration> {
  return {
    appId: "stato",
    productName: "Stato",
    artifactName: "Stato-${os}.${ext}",
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
        name: "Stato Data",
        role: "Viewer",
        icon: "build/document-icons/document.icns"
      }
    ]
  } as Configuration
}
