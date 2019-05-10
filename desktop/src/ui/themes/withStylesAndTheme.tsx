import {CSSProperties} from "../styled"
import materialWithStyles, {
  WithStylesOptions as MaterialWithStylesOptions
} from '@material-ui/styles/withStyles'


import {Theme} from './themes'


import {StyleDeclaration} from './ThemeTypes'
import * as React from 'react'
import {HTMLAttributes, Ref} from 'react'
import {isDefined} from "typeguard"

//type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>


export type StyleRules<Props extends any, ClassKey extends string = string> = Record<
  ClassKey,
  CSSProperties | ((props: Props) => CSSProperties)
  >;

export type PropsOf<C> = C extends new (props: infer P) => React.Component
  ? P
  : C extends (props: infer P) => React.ReactElement<any> | null
    ? P
    : C extends keyof JSX.IntrinsicElements
      ? JSX.IntrinsicElements[C]
      : never;
export type StyleRulesCallback<Theme, Props extends any, ClassKey extends string = string> = (
  theme: Theme,
) => StyleRules<Props, ClassKey>;

export type Styles<Theme, Props extends any, Classes extends string | null = null> =
  | StyleRules<Props, Classes>
  | StyleRulesCallback<Theme, Props, Classes>;

export type ThemeStylesCallback<Classes extends string> = (theme: Theme) => StyleDeclaration<Classes>;
export type WithStylesOptions = MaterialWithStylesOptions & {
  forwardInnerRef?: boolean;
}; //type ComponentType<P = {}> = ComponentClass<P> | FunctionComponent<P>;

export type ThemedClassNames<Classes extends string = string> = {[key in Classes]: string}

// export type ThemedClassMap<S extends Styles<Theme, any> = Styles<Theme, any>> = S extends Styles<Theme, any> ? {
//   classes: ThemedClassNames<ClassKeyOfStyles<S>> //Partial<ClassNameMap<Classes>> | ThemedClassNames<Classes> | undefined | null
// } : {};

export type SimpleThemeProps = {
  theme: Theme
}

export type ThemeProps<Props = any, Classes extends string = string, IncludeTheme extends boolean = false> =
  Props & BasicThemeProps<Classes, IncludeTheme>

export type BasicThemeProps<Classes extends string = string, IncludeTheme extends unknown | boolean = false> = {
  innerRef?: React.Ref<any> | React.RefObject<any> | undefined
  classes: {[name in Classes]: string}
} & (IncludeTheme extends true ? SimpleThemeProps : {})

//<S extends Styles<Theme, any> | unknown | string>
// export type AllThemeProps = {
//   theme?: Theme
//   classes?: ThemedClassNames
//   innerRef?: Ref<any>
// }
//<S extends Styles<Theme, any> | unknown | string, IncludeTheme extends boolean = false>
export type WithStylesInjector = <
  C extends React.ComponentType<any>, // & ConsistentWith<PropsOf<C>, BasicThemeProps<S,IncludeTheme>>
  Props extends PropsOf<C> = any,
  OutProps extends Omit<Props, "classes" | "theme"> = any
  >(component: C) => C extends React.ComponentClass ? React.ComponentClass<OutProps> : React.ReactElement<
OutProps //keyof BasicThemeProps<Classes, Options['withTheme']>
> & any

// function isWithStyleOptions(o:any): o is WithStylesOptions {
//   return o && typeof o !== 'function' && ['flip', 'withTheme', 'name'].some(prop => !!(o as any)[prop])
// }


// export function withStyles<S extends Styles<Theme, any>  = Styles<Theme,any>, Options extends WithStylesOptions = {}>(
//   styles: S,
//   options?: Options
// ): WithStylesInjector<S, Options>
export function withStyles<S extends Styles<Theme, any> | unknown = Styles<Theme,any>, Options extends WithStylesOptions = {}>(
  stylesOrOptions: S,
  options?: Options
): WithStylesInjector {
  
  return component => {
    const WithStyles:any = materialWithStyles<any,any>(stylesOrOptions as any, (options as any) || {})(component as any);
    (WithStyles as any).Naked = (component as any)
    return WithStyles as any
  };
}
export function withTheme(
  options: WithStylesOptions | null = null
) { return withStyles<unknown, {withTheme: true}>({}, {...(isDefined(options) ? options : {}),withTheme: true}) }


export type RootComponentProps = HTMLAttributes<any> & {classes?:ThemedClassNames | undefined}
export function makeRootComponent<T = any, Props extends RootComponentProps = any>(element: string | React.ComponentType<Props>) {
  return React.forwardRef<T,Props>(({
    style,
    classes,
    className,
    children,
    ...other
  }:Props, ref:Ref<T>) => {
    const props = { ...(typeof element === 'string' ? {
        ref
      } : {
        innerRef: ref
      }),
      style,
      className: `${!classes ? "" : (classes!!.root || "")} ${className}`,
      ...other
    }
    return React.createElement(element, props as any, children);
  });
}
export const Div = makeRootComponent('div');
