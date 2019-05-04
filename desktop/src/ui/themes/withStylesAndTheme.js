import materialWithStyles from '@material-ui/styles/withStyles';
import type {CSSProperties} from '../styled/StyleTypes';
import type {Theme} from './themes';
import type {WithStylesOptions as MaterialWithStylesOptions} from '@material-ui/styles/withStyles';
import type {StyleDeclaration} from './ThemeTypes';
import React from 'react';
import type {ComponentType} from 'react';

export type ThemeStylesCallback<Classes> = (theme:Theme) => StyleDeclaration<Classes>

export type WithStylesOptions = MaterialWithStylesOptions & {
  forwardInnerRef?: boolean
};

//type ComponentType<P = {}> = ComponentClass<P> | FunctionComponent<P>;

export type ThemedClassNames<Classes : string = *> = {
  [key:Classes]: string
};

export type ThemedClassMap<Classes : string = *> = {
  classes:ThemedClassNames<Classes>
};

export type ThemeProps = {
  theme: Theme
} & any;

export type ThemedClassesProps<Props = *, Classes : string = *> = Props & ThemedClassMap<Classes> & ThemeProps;

export type WithStylesComponentOut<Props : any, Classes : any> = ComponentType<$Diff<Props,ThemedClassMap<Classes> & ThemeProps>>;

export function withStyles<Props : any, Classes : any>(
  styles:(((theme:Theme) => CSSProperties) | CSSProperties) | WithStylesOptions,
  options?: ?WithStylesOptions
):(component:ComponentType<Props>) => WithStylesComponentOut<Props,Classes> {

  if (styles && typeof styles !== 'function' && ['flip', 'withTheme', 'name'].some(prop => !!styles[prop])) {
    options = (styles : WithStylesOptions);
    styles = (theme:Theme):CSSProperties => ({});
  }
  
  return (component:ComponentType<ThemedClassesProps<Props,Classes>>):React.ComponentType<Props> => {
    const WithStyles = materialWithStyles(styles, (options : any) || {})(component);
    WithStyles.Naked = (component : any);
    return WithStyles;
  }
}

export function makeRootComponent(element: string|React.ComponentType<any>) {
  return React.forwardRef(({style, classes,className,children,...other},ref) => {
    return React.createElement(
      element,
      {
        ...(typeof element === 'string' ? {ref} : {innerRef:ref}),
        style,
        className:`${classes.root} ${className}`,
        ...other
      },
      children
    );
  })
}

export const Div = makeRootComponent('div');
