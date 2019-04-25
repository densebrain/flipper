import materialWithStyles from '@material-ui/styles/withStyles';
import type {StyledElement, CSSProperties, ThemedProps} from '../styled';
import type {Theme} from './themes';
import type {WithStylesOptions} from '@material-ui/styles/withStyles';
import type {StyleDeclaration} from './ThemeTypes';
export type {WithStylesOptions} from '@material-ui/styles/withStyles';
import React from 'react';
import type {ComponentType} from 'react';

//type ComponentType<P = {}> = ComponentClass<P> | FunctionComponent<P>;


export type ThemedClassesProps<Props: any, Classes : any> = Props & {
  theme: Theme,
  classes: StyleDeclaration<Classes>;
};

export type WithStylesComponentOut<Props : any, Classes : any> = ComponentType<$Diff<Props,{classes: StyleDeclaration<Classes>, theme: Theme}>>;

export function withStyles<Props : any, Classes : any>(
  styles:(((theme:Theme) => CSSProperties) | CSSProperties) | WithStylesOptions,
  options?: ?WithStylesOptions
):(component:ComponentType<Props>) => WithStylesComponentOut<Props,Classes> {

  if (styles && typeof styles !== 'function' && ['flip', 'withTheme', 'name'].some(prop => !!styles[prop])) {
    options = (styles : WithStylesOptions);
    styles = (theme:Theme):CSSProperties => ({});
  }
  
  return materialWithStyles(styles, (options : any) || {});
}
