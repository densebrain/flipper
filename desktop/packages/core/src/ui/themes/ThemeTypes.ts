import { ColorProperty } from 'csstype';
import { CSSProperties } from "@material-ui/styles/withStyles";
export type Palette = {
  name: string;
  author: string;
  scheme: string
  base00: ColorProperty;
  base01: ColorProperty;
  base02: ColorProperty;
  base03: ColorProperty;
  base04: ColorProperty;
  base05: ColorProperty;
  base06: ColorProperty;
  base07: ColorProperty;
  base08: ColorProperty;
  base09: ColorProperty;
  base0A: ColorProperty;
  base0B: ColorProperty;
  base0C: ColorProperty;
  base0D: ColorProperty;
  base0E: ColorProperty;
  base0F: ColorProperty;
};
export type Colors = {
  background: ColorProperty;
  text: ColorProperty;
  textLight: ColorProperty;
  textInput: ColorProperty;
  textBlur: ColorProperty;
  textStatus: ColorProperty;
  textDepressed: ColorProperty;
  textSelected: ColorProperty;
  textInverted: ColorProperty;
  backgroundStatus: ColorProperty;
  backgroundSelected: ColorProperty;
  backgroundInverted: ColorProperty;
  backgroundInput: ColorProperty;
  warn: ColorProperty;
  warnText: ColorProperty;
  error: ColorProperty;
  errorText: ColorProperty;
  accent: ColorProperty;
  accentText: ColorProperty;
  border: ColorProperty;
  borderSelected: ColorProperty;
};
export type StyleDeclaration<Classes extends string = string> = {
  [key in Classes]: CSSProperties
};
export type ThemeComponent = any & CSSProperties;
export type BaseTheme = {
  palette: Palette;
  colors: Colors;
} & any;
export type ThemeCustomizer = (theme: BaseTheme, palette: Palette, colors: Colors) => BaseTheme;
export type ColorCustomizer = (palette: Palette, colors: Colors) => Colors;
export type ThemeConfig = {
  palette: Palette;
  customizeColors?: ColorCustomizer | null | undefined;
  customizeTheme?: ThemeCustomizer | null | undefined;
};
export type ThemeComponents = {
  [key: string]: ThemeComponent
};
