import * as React from 'react'
import filterProps from 'react-valid-props';
import {isDefined, isString} from "typeguard"
import {Theme, ThemeProps} from '../themes'
import { withStyles } from '../themes';
import { memoFn, simpleIsEqual } from '../../utils/memoize'; //import React from 'react';

export type RootViewClasses = "root";
export type RootViewProps<ElementType = any> = React.HTMLAttributes<ElementType> & {
  innerRef?: React.Ref<ElementType> | React.RefObject<ElementType> | undefined
}
export function RootView<Props extends RootViewProps = RootViewProps>(props: Props): React.ReactElement<Props,any> {
  const {
    className,
    children,
    ...other
  } = (props as any);
  return <div className={className} {...filterProps(other)}>{children}</div>;
}

export type RootViewComponentType<Props extends RootViewProps> = React.ComponentType<Props> | (((props:Props) => (React.ReactElement<Props,any> | React.ReactNode)) | React.ReactElement<Props,any>)

export type RootViewStyler<ViewProps> = (props: ViewProps) => any

export function makeRootView<
  Props extends RootViewProps = any,
  Classes extends RootViewClasses = RootViewClasses,
  ViewProps extends ThemeProps<Props,Classes,true> = any,
  C extends RootViewComponentType<Props> = any
>(styles: (theme: Theme) => any, component: C = RootView as C, stylerOrName: RootViewStyler<ViewProps> | null | undefined | string = null, styler: RootViewStyler<ViewProps> | null | undefined = null): C {
  //if (!Component)
  
  let displayName: string | null
  if (isString(stylerOrName)) {
    displayName = stylerOrName
  } else if (!isDefined(styler)) {
    displayName = "NoName"
    styler = stylerOrName
  }
  
  const
    memoStyler = memoFn((props: ViewProps) => {
      const {style} = props
      return {
        ...(styler ? styler(props) : {}),
        ...(style || {})
      }
    }, simpleIsEqual, true),
   view = withStyles((((theme: Theme) => ({
      root: styles(theme)
    })) as any), {
      withTheme: true
    })(React.forwardRef<C, ViewProps>((props, ref) => {
      let {
        style,
        className,
        classes,
        theme,
        ...other
      } = props;
  
      if (style || styler) {
        style = memoStyler(props);
      }
  
      const Component = component as any
      return <Component {...!ref ? {} : (Component as any).Naked ? {
        innerRef: ref
      } : {
        ref
      }} {...style ? {
        style
      } : {}} className={`${(classes as any).root}${!className ? '' : ` ${className}`}`} {...other} />;
    }))
  
  view.displayName = displayName
  return view
}
