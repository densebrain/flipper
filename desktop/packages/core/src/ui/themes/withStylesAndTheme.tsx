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
import * as React from "react"
import { HTMLAttributes, Ref } from "react"
import { nameFunction } from "../../utils"
import { CSSProperties } from "../styled"
import { Theme } from "./Themes"
import { StyleDeclaration } from "./ThemeTypes"
import { getValue, isDefined, isFunction } from "typeguard"

const { withStyles: materialWithStyles } = require("@material-ui/styles")

//type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export interface WithStylesOptions {
  flip?: boolean
  withTheme?: boolean
  name?: string
  forwardInnerRef?: boolean
}

export type StyleRules<
  Props extends any,
  ClassKey extends string = string
> = Record<ClassKey, CSSProperties | ((props: Props) => CSSProperties)>

export type PropsOf<C> = C extends new (props: infer P) => React.Component
  ? P
  : C extends (props: infer P) => React.ReactElement<any> | null
  ? P
  : C extends keyof JSX.IntrinsicElements
  ? JSX.IntrinsicElements[C]
  : never

export type StyleRulesCallback<
  Theme,
  Props extends any,
  ClassKey extends string = string
> = (theme: Theme) => StyleRules<Props, ClassKey>

export type Styles<
  Theme,
  Props extends any,
  Classes extends string | null = null
> = StyleRules<Props, Classes> | StyleRulesCallback<Theme, Props, Classes>

export type ThemeStylesCallback<Classes extends string> = (
  theme: Theme
) => StyleDeclaration<Classes>

export type ThemedClassNames<Classes extends string = string> = {
  [key in Classes]: string
}

export type SimpleThemeProps = {
  theme: Theme
}

export type ThemeProps<
  Props = any,
  Classes extends string = string,
  IncludeTheme extends boolean = false
> = Props & BasicThemeProps<Classes, IncludeTheme>

export type BasicThemeProps<
  Classes extends string = string,
  IncludeTheme extends unknown | boolean = false
> = {
  innerRef?: React.Ref<any> | React.RefObject<any> | undefined
  classes: { [name in Classes]: string }
} & (IncludeTheme extends true ? SimpleThemeProps : {})

export type WithStylesInjector = <
  C extends React.ComponentType<any>, // & ConsistentWith<PropsOf<C>, BasicThemeProps<S,IncludeTheme>>
  Props extends PropsOf<C> = any,
  OutProps extends Omit<Props, "classes" | "theme"> = any
>(
  component: C
) => C extends React.ComponentClass
  ? React.ComponentClass<OutProps>
  : React.ReactElement<
      OutProps //keyof BasicThemeProps<Classes, Options['withTheme']>
    > &
      any

export function withStyles<
  S extends Styles<Theme, any> | unknown = Styles<Theme, any>,
  Options extends WithStylesOptions = {}
>(stylesOrOptions: S, options?: Options): WithStylesInjector {
  return component => {
    options = options || ({} as Options)
    options.name =
      getValue(() => options.name, null) ||
      getValue(
        () => (component as any).displayName || (component as any).name,
        null
      ) ||
      "withStyles"

    if (isFunction(component) && !component.displayName && !component.name)
      component = nameFunction(options.name, component)

    if (!component.displayName) {
      component.displayName = options.name
    }

    const WithStyles: any = materialWithStyles(
      stylesOrOptions as any,
      options as any
    )(component as any)
    ;(WithStyles as any).Naked = component as any

    WithStyles.displayName = options.name

    return WithStyles as any
  }
}
export function withTheme(options: WithStylesOptions | null = null) {
  return withStyles<unknown, { withTheme: true }>(
    {},
    { ...(isDefined(options) ? options : {}), withTheme: true }
  )
}

export type RootComponentProps = HTMLAttributes<any> & {
  classes?: ThemedClassNames | undefined
}
export function makeRootComponent<
  T = any,
  Props extends RootComponentProps = any
>(
  element: string | React.ComponentType<Props>,
  displayName: string | null = null
) {
  displayName =
    getValue(
      () => (element as any).displayName || (element as any).name,
      null
    ) ||
    displayName ||
    "makeRootComponent"

  const fn = nameFunction(
    displayName,
    ({ style, classes, className, children, ...other }: Props, ref: Ref<T>) => {
      const props = {
        ...(typeof element === "string"
          ? {
              ref
            }
          : {
              innerRef: ref
            }),
        style,
        className: `${!classes ? "" : classes!!.root || ""} ${className}`,
        ...other
      }
      return React.createElement(element, props as any, children)
    }
  )

  const view = React.forwardRef<T, Props>(fn)

  view.displayName = displayName

  return view
}
export const Div = makeRootComponent("div")
