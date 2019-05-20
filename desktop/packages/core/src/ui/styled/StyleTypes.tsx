//import { Theme } from '../themes/themes'; //export {CSSProperties} from '@material-ui/styles/withStyles';
//import type {CSSProperties as MaterialCSSProperties} from '@material-ui/styles/withStyles';

import * as React from 'react';
import CSS from "csstype"

export interface CSSProperties<Props = any> extends CSS.Properties<number | string | ((props: Props) => (CSS.Properties | number | string))> {
  [k: string]: CSS.Properties<number | string>[keyof CSS.Properties] | CSSProperties | ((props:Props) => (CSS.Properties | number | string))
}

export type StylerFnOrStyles<Props extends any = any> = CSSProperties | ((props: Props) => CSSProperties)
export type StyledElement<Props extends any = any> = React.Component<Props> | React.ReactElement<Props> | ((props: Props) => React.ReactElement<Props>) | string | React.ComponentType<Props>

export interface StyleMakerFn<P extends any = any> {
  (props: P): CSSProperties
  filterProps?: Array<keyof P> | null | undefined
}
