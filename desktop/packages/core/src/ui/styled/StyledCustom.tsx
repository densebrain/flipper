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
import { HTMLAttributes } from "react"
import hoistNonReactStatics from "hoist-non-react-statics"
import {
  ThemedClassNames,
  withStyles,
  WithStylesOptions
} from "../themes/withStylesAndTheme"
import { Theme } from "../themes/Themes"
import { StyledElement, StyleMakerFn, StylerFnOrStyles } from "./StyleTypes"
import filterProps from "react-valid-props"
import { memoFn } from "../../utils/memoize"

const { getDisplayName } = require("@material-ui/utils")

function omit<
  I extends any = any,
  F extends keyof I = any,
  O extends FilterTypes<I, F> = FilterTypes<I, F>
>(input: I, fields: Array<F & string>): O {
  const output: O = {} as any
  Object.keys(input).forEach((prop: string & F) => {
    if (fields.indexOf(prop) === -1) {
      output[prop] = input[prop]
    }
  })
  return output
}

export type AllStyledProps<Props> = HTMLAttributes<any> &
  Props & {
    classes?: ThemedClassNames<"root">
    clone?: boolean | undefined
    component?: React.ReactNode | string | undefined
    innerRef?: React.Ref<any> | React.RefObject<any>
  }

function styled<
  Props = any,
  State = {},
  AllProps extends AllStyledProps<Props> = AllStyledProps<Props>,
  ComponentType extends
    | StyledElement<AllProps>
    | React.ComponentClass<Props, State> = StyledElement<AllProps>
>(Component: ComponentType, componentName: string | null | undefined = null) {
  return (
    style: StylerFnOrStyles<AllProps> | StyleMakerFn<AllProps>,
    options: WithStylesOptions | null | undefined = null
  ) => {
    const StyledComponent: any = React.forwardRef<ComponentType, AllProps>(
      (props, ref) => {
        const {
          children,
          classes,
          className: classNameProp,
          clone,
          component: ComponentProp,
          ...other
        } = props

        if (options && options.forwardInnerRef === true) {
          other.innerRef = ref
          ref = null
        }

        const className = `${classes.root} ${classNameProp}`

        if (clone && children) {
          return React.cloneElement(children as any, {
            className: `${(children as any).props.className} ${className}`,
            ...(ref
              ? {
                  ref
                }
              : {})
          })
        }

        let spread = other

        const { filterProps: customFilterProps } = style as StyleMakerFn<
          typeof spread
        >
        if (customFilterProps) {
          spread = omit<typeof spread, any>(spread, customFilterProps)
        }

        if (typeof children === "function") {
          return children({
            className,
            ...spread,
            ...(ref
              ? {
                  ref
                }
              : {})
          })
        }

        const FinalComponent = (ComponentProp || Component) as ComponentType,
          UnfilteredProps = { ...spread },
          AllProps =
            typeof FinalComponent === "string"
              ? filterProps(UnfilteredProps)
              : UnfilteredProps // noinspection JSUnresolvedFunction

        return React.createElement(
          FinalComponent as any,
          {
            ...AllProps,
            className,
            ...(ref
              ? {
                  ref
                }
              : {})
          },
          children
        )
      }
    )

    if (process.env.NODE_ENV !== "production") {
      StyledComponent.displayName =
        componentName || `Styled(${getDisplayName(Component)})`
    }

    const styles =
      typeof style === "function"
        ? memoFn((theme: Theme) => ({
            root: (props: AllProps) =>
              style({
                theme,
                ...theme,
                ...props
              })
          }))
        : {
            root: style
          }

    hoistNonReactStatics(StyledComponent, Component as any)

    return (withStyles(styles as any, options || {}) as any)(StyledComponent)
  }
}

export default styled
