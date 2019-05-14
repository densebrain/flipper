import {TopLevelMenu} from "./MenuTypes"


export type KeyboardAction = {
  action: string,
  label: string,
  accelerator?: string,
  topLevelMenu: TopLevelMenu
}
export const DefaultKeyboardActions: Array<KeyboardAction> = [
  {
    label: "Clear",
    accelerator: "CmdOrCtrl+K",
    topLevelMenu: "View",
    action: "clear"
  },
  {
    label: "Go To Bottom",
    accelerator: "CmdOrCtrl+B",
    topLevelMenu: "View",
    action: "goToBottom"
  },
  {
    label: "Create Paste",
    topLevelMenu: "Edit",
    action: "createPaste"
  }
]

export type DefaultKeyboardAction = "clear" | "goToBottom" | "createPaste"
export type KeyboardActions = Array<DefaultKeyboardAction | KeyboardAction>
export type KeyboardActionHandler = ((action: string) => void) | null | undefined
