import * as FlexStyles from "./ui/styled/flex-styles"
import * as Styles from "./ui/styled/prebuilt-styles"

const PrebuiltStyles = {
  ...FlexStyles,
  ...Styles
}

Object.assign(global, {
  S: PrebuiltStyles
})

declare global {
  const S: typeof PrebuiltStyles
}

export {}
