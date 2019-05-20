import * as React from "react"
import {Theme} from "./Themes"

export const ThemeContext = require("@material-ui/styles/ThemeContext").default as React.Context<Theme>

//export const ThemeContext = React.createContext<Theme>(null)
