import { CSSProperties } from "@material-ui/styles/withStyles";
import { Color } from "csstype";
import tinycolor from 'tinycolor2';
import _ from 'lodash';
export type CSSPropFn<P = any> = (props: P) => number | string;
export function toDashCase(str: string): string {
  return str.replace(/([A-Z])/g, g => `-${g[0].toLowerCase()}`);
}
export function makeDimensionConstraint<P extends any>(dim: 'width' | 'height', val: string | number | CSSPropFn<P>): CSSProperties {
  const dimUpper = dim.charAt(0).toUpperCase() + dim.substring(1);
  return {
    [dim]: val,
    [`min${dimUpper}`]: val,
    [`max${dimUpper}`]: val,
    overflow: 'hidden'
  } as CSSProperties;
} // noinspection JSUnusedGlobalSymbols

export const HeightProperties = ["height", "maxHeight", "minHeight"]; // noinspection JSUnusedGlobalSymbols

export const WidthProperties = ["width", "maxWidth", "minWidth"];
export function makeHeightConstraint<P extends any>(val: string | number | CSSPropFn<P>): CSSProperties {
  return makeDimensionConstraint<P>('height', val);
}
export function makeWidthConstraint<P extends any>(val: string | number | CSSPropFn<P>): CSSProperties {
  return makeDimensionConstraint<P>('width', val);
} // noinspection JSSuspiciousNameCombination
// noinspection JSUnusedGlobalSymbols,JSSuspiciousNameCombination

export function makeDimensionConstraints<P extends any>(width: string | number | CSSPropFn<P>, height: string | number | CSSPropFn<P> = width): CSSProperties {
  return { ...makeHeightConstraint(height),
    ...makeWidthConstraint(width)
  };
}
export const FillHeight = makeHeightConstraint('100%');
export const FillWidth = makeWidthConstraint('100%');
export const Fill = { ...FillWidth,
  ...FillHeight
}; // noinspection JSUnusedGlobalSymbols

export const FillWindow = Object.assign(makeWidthConstraint('100vw'), makeHeightConstraint('100vh')); // noinspection JSUnusedGlobalSymbols

export const Transparent = 'transparent'; // noinspection JSUnusedGlobalSymbols

export const BorderBoxSizing: CSSProperties = {
  boxSizing: 'border-box'
}; // noinspection JSUnusedGlobalSymbols

export const OverflowHidden: CSSProperties = {
  overflow: 'hidden'
}; // noinspection JSUnusedGlobalSymbols

export const OverflowAuto: CSSProperties = {
  overflow: 'auto'
}; //region Cursors
// noinspection JSUnusedGlobalSymbols

export const CursorPointer: CSSProperties = {
  cursor: 'pointer'
}; //endregion
// noinspection JSUnusedGlobalSymbols

export const Ellipsis: CSSProperties = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}; //region Positioning
// noinspection JSUnusedGlobalSymbols

export const PositionRelative: CSSProperties = {
  position: 'relative'
}; // noinspection JSUnusedGlobalSymbols

export const PositionAbsolute: CSSProperties = {
  position: 'absolute'
};
export const TransitionDuration = {
  Short: 250,
  Long: 500
};
export function alpha(color: Color, alpha: number): Color {
  return tinycolor(color).setAlpha(alpha).toRgbString();
} // noinspection JSUnusedGlobalSymbols

/**
 * Create a transition property with default config
 *
 * @global
 *
 * @param props
 * @param duration
 * @param easing
 * @returns {{transition: any}}
 */

export function makeTransition(props: Array<string> | string = ["all"], duration: number | string = TransitionDuration.Short, easing: string = 'ease-out'): CSSProperties {
  if (typeof props == "string") props = [props];
  props = props || ['all'];
  return {
    transition: props.map(prop => `${toDashCase(prop)} ${duration}ms ${easing}`).join(', ')
  };
} // noinspection JSUnusedGlobalSymbols

export function makeFlexAlign(alignItems: string, justifyContent: string = alignItems): CSSProperties {
  return {
    justifyContent,
    alignItems
  };
} // noinspection JSUnusedGlobalSymbols
// noinspection JSSuspiciousNameCombination

export function makePadding(top: string | number = 0, right: string | number = top, bottom: string | number = top, left: string | number = right): CSSProperties {
  return {
    paddingTop: top,
    paddingRight: right,
    paddingBottom: bottom,
    paddingLeft: left
  };
} // noinspection JSSuspiciousNameCombination

export function makePaddingRem(top: number = 0, right: number = top, bottom: number = top, left: number = right): CSSProperties {
  return makePadding(remToPx(top), remToPx(right), remToPx(bottom), remToPx(left));
} // noinspection JSSuspiciousNameCombination

export function makeBorder(top: string | number = 0, right: string | number = top, bottom: string | number = top, left: string | number = right): CSSProperties {
  return {
    borderTop: top,
    borderRight: right,
    borderBottom: bottom,
    borderLeft: left
  };
} // noinspection JSSuspiciousNameCombination ,JSUnusedGlobalSymbols

export function makeBorderRem(top: number = 0, right: number = top, bottom: number = top, left: number = right): CSSProperties {
  return makeBorder(remToPx(top), remToPx(right), remToPx(bottom), remToPx(left));
} // noinspection JSSuspiciousNameCombination

export function makeMargin(top: string | number = 0, right: string | number = top, bottom: string | number = top, left: string | number = right): CSSProperties {
  return {
    marginTop: top,
    marginRight: right,
    marginBottom: bottom,
    marginLeft: left
  };
} // noinspection JSSuspiciousNameCombination

export function makeMarginRem(top: number = 0, right: number = top, bottom: number = top, left: number = right): CSSProperties {
  return makeMargin(rem(top), rem(right), rem(bottom), rem(left));
} // noinspection JSUnusedGlobalSymbols

export const PaddingProps: Array<string> = Object.keys(makePaddingRem(0)).map(key => key.replace(/([A-Z])/g, g => `-${g[0].toLowerCase()}`)); // noinspection JSUnusedGlobalSymbols

export const MarginProps: Array<string> = Object.keys(makeMarginRem(0)).map(key => key.replace(/([A-Z])/g, g => `-${g[0].toLowerCase()}`));
export function rem(val: number): string {
  return `${remToPx(val)}px`; //${val}rem`
} // noinspection JSUnusedGlobalSymbols

export function makeStyle(...styles: any[]): CSSProperties {
  return Object.assign({}, ...styles.reduce((allStyles, style) => {
    if (Array.isArray(style)) {
      allStyles.push(...style);
    } else {
      allStyles.push(style);
    }

    return allStyles;
  }, []));
}
export function remToPx(rem: number): number {
  return Math.round(rem * parseFloat(getComputedStyle((document.documentElement as any)).fontSize));
} // noinspection JSUnusedGlobalSymbols

export function directChild(className: string, state: string = ""): string {
  return child(className, state, true);
}
export function child(className: string, state: string = "", direct: boolean = false): string {
  return `&${_.isEmpty(state) ? "" : `:${state}`} ${direct ? ">" : ""} .${className}`;
} // noinspection JSUnusedGlobalSymbols

export function important(value: string | number): string {
  return `${value} !important`;
}
export function makeLinearGradient(...colorStops: string[]): string {
  //return `-webkit-linear-gradient(${colorStops.join(',')})`
  return `linear-gradient(${colorStops.join(',')})`;
} // noinspection JSUnusedGlobalSymbols

export function makeLinearGradientContentBox(...colorStops: string[]): string {
  //return `-webkit-linear-gradient(${colorStops.join(',')})`
  return `content-box ${makeLinearGradient(...colorStops)}`;
}
