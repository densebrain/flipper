import { Theme } from '../themes/themes'; //export {CSSProperties} from '@material-ui/styles/withStyles';
//import type {CSSProperties as MaterialCSSProperties} from '@material-ui/styles/withStyles';

import * as React from 'react';
import { Properties } from "csstype";
export type CSSProperties<Props = any> = {
  [k: string]: string | number | Properties<any> | ((props: Props) => any)
} & Properties<any> ;
export type ThemedProps<Props extends object = any> = Props & {
  theme: Theme;
};
export type StylerFnOrStyles<Props extends any = any> = CSSProperties | ((props: Props) => CSSProperties);
export type StyledElement<Props extends any = any> = React.Component<Props> | React.ReactElement<Props> | ((props: Props) => React.ReactElement<Props>) | string | React.ComponentType<Props>;
export interface StyleMakerFn<P extends any = any> {
  (props: P): CSSProperties
  filterProps?: Array<keyof P> | null | undefined;
}
