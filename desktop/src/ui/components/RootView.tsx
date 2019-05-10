import filterProps from 'react-valid-props';
import { Theme } from '../themes';
import { withStyles } from '../themes';
import { memoFn, simpleIsEqual } from '../../utils/memoize'; //import React from 'react';

export function RootView(props: React.HTMLProps<any>) {
  const {
    className,
    children,
    ...other
  } = (props as any);
  return <div className={className} {...filterProps(other)}>{children}</div>;
}
export type RootViewClasses = "root";
export function makeRootView(styles: (theme: Theme) => any, Component: React.ComponentType<any> = RootView, styler: (props: any) => any | null | undefined = null): React.ComponentType<any> {
  const memoStyler = memoFn(({
    style,
    ...other
  }) => ({ ...(styler ? styler(other) : {}),
    ...(style || {})
  }), simpleIsEqual, true);
  return withStyles<React.HTMLProps<any>, RootViewClasses>(((theme => ({
    root: styles(theme)
  })) as any), {
    withTheme: true
  })(React.forwardRef((props, ref) => {
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

    return <Component {...!ref ? {} : Component.Naked ? {
      innerRef: ref
    } : {
      ref
    }} {...style ? {
      style
    } : {}} className={`${classes.root}${!className ? '' : ` ${className}`}`} {...other} />;
  }));
}
