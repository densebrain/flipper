import type {Theme} from '../themes/themes';
//export type {CSSProperties} from '@material-ui/styles/withStyles';
//import type {CSSProperties as MaterialCSSProperties} from '@material-ui/styles/withStyles';
import * as React from 'react';
import type {Properties} from "csstype";

export type CSSProperties = {
  [k: string]:
    | $ElementType<Properties<any>, $Keys<Properties<any>>>
    | CSSProperties
} & Properties<any> & { [k:$Keys<Properties<any>>]: ((props:any) => any)};

export type ThemedProps<Props : any = any> = Props & {
  theme:Theme
};

export type StylerFnOrStyles<Props : any = any> = CSSProperties | ((props: ThemedProps<Props>) => CSSProperties);

export type StyledElement<Props : any = any> = React.Component<Props> | React.Element<Props> | ((props:Props) => React.Element<Props>) | string | React.ComponentType<Props>;

export interface StyleMakerFn<P : any = any> {
  (props: P & {theme: Theme}): CSSProperties;
  filterProps?: ?Array<string>
}
