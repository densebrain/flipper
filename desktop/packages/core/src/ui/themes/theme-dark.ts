/**
 * Copyright 2019-present Densebrain.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Copyright 2019-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { BaseTheme, Colors, Palette, ThemeConfig } from "./ThemeTypes"
import { darken, lighten } from "@material-ui/core/styles/colorManipulator"
const darkThemeConfig: ThemeConfig = {
  palette: {
    name: "dark",
    scheme: "dark",
    author: "Lalit Magant (http://github.com/tilal6991)",
    base00: "#282c34",
    base01: "#353b45",
    base02: "#3e4451",
    base03: "#545862",
    base04: "#565c64",
    base05: "#c7cedb",
    base06: "#d9e0ed",
    base07: "#ffffff",
    base08: "#e0283e",
    //base09: "#8155cb",
    base09: "#3c45cb",
    base0A: "#e5c07b",
    base0B: "#98c379",
    base0C: "#56b6c2",
    base0D: "#4554f5",
    base0E: "#c678dd",
    base0F: "#4a4a93"
  },

  customizeTheme(theme: BaseTheme, _palette: Palette, colors: Colors) {
    return {
      ...theme,
      titlebar: (props: any) => {
        const { focused } = props
        return {
          ...theme.titlebar(props),
          background: focused
            ? `linear-gradient(to right, ${darken(
                colors.backgroundStatus,
                0.15
              )} 0%, ${colors.backgroundStatus} 100%)`
            : colors.backgroundStatus,
          borderBottom: `1px solid ${lighten(colors.border, 0.2)}`
        }
      }
    }
  }
}
export default darkThemeConfig
