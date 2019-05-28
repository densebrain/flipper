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
import darkThemeConfig from "./theme-dark"
import lightThemeConfig from "./theme-light"
import { ColorProperty } from "csstype"
import {
  darken,
  getContrastRatio,
  lighten
} from "@material-ui/core/styles/colorManipulator"
import { BaseTheme, Colors, ThemeConfig } from "./ThemeTypes"
import { alpha } from "../styled/prebuilt-styles"

const contrastThreshold = 3

function makeTheme(themeConfig: ThemeConfig) {
  const { palette, customizeTheme, customizeColors } = themeConfig,
    accent = palette.base09,
    text = palette.base05,
    textInverted = palette.base01,
    background = palette.base00,
    backgroundStatus = palette.base02,
    backgroundInverted = palette.base07,
    backgroundSelected = palette.base0D

  const getContrastText = (bg: ColorProperty) =>
    getContrastRatio(bg, text) >= contrastThreshold ? text : textInverted

  const textSelected = getContrastText(backgroundSelected),
    error = palette.base08

  let colors: Colors = {
    background,
    text,
    textInput: darken(text, 0.1),
    textLight: alpha(text, 0.8),
    textBlur: lighten(text, 0.1),
    textDepressed: backgroundSelected,
    backgroundStatus,
    textStatus: getContrastText(backgroundStatus),
    backgroundInput: lighten(background, 0.15),
    backgroundSelected,
    textSelected,
    backgroundInverted,
    textInverted,
    warn: palette.base0A,
    warnText: getContrastText(palette.base0A),
    error,
    errorText: getContrastText(error),
    accent,
    accentText: getContrastText(accent),
    border: palette.base02,
    borderSelected: backgroundSelected
  }

  if (customizeColors) {
    colors = customizeColors(palette, colors)
  }

  let theme = {
    palette,
    colors,
    getContrastText,
    titlebar: ({ focused }: { focused?: boolean }) => ({
      background: focused
        ? `linear-gradient(to bottom, ${colors.backgroundStatus} 0%, ${lighten(
            colors.backgroundStatus,
            0.1
          )} 100%)`
        : colors.backgroundStatus,
      borderBottom: `1px solid ${focused ? colors.border : colors.border}`
    }),
    panel: {
      container: {},
      header: {},
      body: {}
    },
    logs: {
      unknown: {
        color: palette.base04
      },
      verbose: {
        color: palette.base05
      },
      debug: {
        color: palette.base0C
      },
      info: {
        color: palette.base0D
      },
      warn: {
        backgroundColor: alpha(palette.base0A, 0.2),
        color: getContrastText(alpha(palette.base0A, 0.2)),
        fontWeight: 500
      },
      error: {
        backgroundColor: alpha(palette.base08, 0.4),
        color: getContrastText(alpha(palette.base08, 0.4)),
        fontWeight: 500
      },
      fatal: {
        backgroundColor: alpha(palette.base08, 0.6),
        color: getContrastText(alpha(palette.base08, 0.6)),
        fontWeight: 700
      }
    },
    sidebar: {
      backgroundColor: palette.base01
    },
    plugin: {
      colors: [palette.base0F]
    }
  }

  if (customizeTheme) {
    theme = customizeTheme(theme, palette, colors)
  }

  return theme
}

const light = makeTheme(lightThemeConfig)
export type Theme = typeof light
export const Themes: {
  [name: string]: Theme & BaseTheme
} = {
  dark: makeTheme(darkThemeConfig),
  light
}
