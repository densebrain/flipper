/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import {Component, HTMLAttributes} from 'react'
import styled from '../styled/index';
import Text from './Text';
import FlexRow from './FlexRow';
import {SimpleThemeProps, ThemeProps, withTheme} from "../themes"
import {FlexBoxProps} from "./FlexBox"
import {ColorProperty} from "csstype"
import * as React from "react"
type DataPoint = {
  time: number;
  color?: string;
  label: string;
  key: string;
};
type Props = ThemeProps<HTMLAttributes<any> & {
  onClick?: (keys: Array<string>) => any;
  selected?: string | null | undefined;
  points: Array<DataPoint>;
  lineHeight: number;
  maxGap: number;
},string,true>;

type MarkersProps = ThemeProps<HTMLAttributes<any> & {
  totalTime?: number | string
},string,true>;
const Markers = styled('div')((props: MarkersProps) => {
  const {theme: {colors}} = props
  return ({
    position: 'relative',
    margin: 10,
    height: props.totalTime,
    '::before': {
      content: '""',
      width: 1,
      borderLeft: `1px dotted ${colors.border}`,
      position: 'absolute',
      top: 5,
      bottom: 20,
      left: 5
    }
  })
});

type PointProps = ThemeProps<FlexBoxProps & HTMLAttributes<any> & {
  positionY?: number | undefined
  number?: number | string
  threadColor?: ColorProperty | undefined
  selected?: boolean | undefined
  cut?: boolean | undefined
},string,true>;
const Point = styled(FlexRow)((props: PointProps) => {
  const {theme:{colors}} = props
  return ({
    position: 'absolute',
    top: props.positionY,
    left: 0,
    right: 10,
    cursor: props.onClick ? 'pointer' : 'default',
    borderRadius: 3,
    alignItems: 'center',
    ':hover': {
      background: props.onClick ? colors.backgroundSelected : 'transparent'
    },
    '::before': {
      position: 'relative',
      textAlign: 'center',
      fontSize: 8,
      fontWeight: 500,
      content: props.number ? `'${props.number}'` : '""',
      display: 'inline-block',
      width: 9,
      height: 9,
      flexShrink: 0,
      color: 'rgba(0,0,0,0.4)',
      lineHeight: '9px',
      borderRadius: '999em',
      border: '1px solid rgba(0,0,0,0.2)',
      backgroundColor: props.threadColor,
      marginRight: 6,
      boxShadow: props.selected ? `0 0 0 2px ${colors.border}` : null
    },
    '::after': {
      content: props.cut ? '""' : null,
      position: 'absolute',
      width: 11,
      top: -20,
      left: 0,
      height: 2,
      background: colors.background,
      borderTop: `1px solid ${colors.border}`,
      borderBottom: `1px solid ${colors.border}`,
      transform: `skewY(-10deg)`
    }
  })
});
const Time = styled('span')((props: SimpleThemeProps) => ({
  color: props.theme.colors.text,
  fontWeight: 300,
  marginRight: 4
}));
const Code = styled(Text)({
  overflow: 'hidden',
  textOverflow: 'ellipsis'
});
type TimePoint = {
  timestamp: number;
  markerNames: Array<string>;
  markerKeys: Array<string>;
  isCut: boolean;
  positionY: number;
  color: string;
};
type State = {
  timePoints: Array<TimePoint>;
};

export function MarkerTimeline_getDerivedStateFromProps(props: Props) {
  const {points, lineHeight, maxGap,theme:{colors}} = props
  const sortedMarkers: Array<[number, Array<DataPoint>]> = Array.from(points.reduce((acc: Map<number, Array<DataPoint>>, cv: DataPoint) => {
    const list = acc.get(cv.time);
    
    if (list) {
      list.push(cv);
    } else {
      acc.set(cv.time, [cv]);
    }
    
    return acc;
  }, (new Map() as Map<number, Array<DataPoint>>)).entries()).sort((a, b) => a[0] - b[0]);
  const smallestGap = sortedMarkers.reduce((acc, cv, i, arr) => {
    if (i > 0) {
      return Math.min(acc, cv[0] - arr[i - 1][0]);
    } else {
      return acc;
    }
  }, Infinity);
  let positionY = 0;
  const timePoints: Array<TimePoint> = [];
  
  for (let i = 0; i < sortedMarkers.length; i++) {
    const [timestamp, points] = sortedMarkers[i];
    let isCut = false;
    const color = sortedMarkers[i][1][0].color || colors.text;
    
    if (i > 0) {
      const relativeTimestamp = timestamp - sortedMarkers[i - 1][0];
      const gap = relativeTimestamp / smallestGap * lineHeight;
      
      if (gap > maxGap) {
        positionY += maxGap;
        isCut = true;
      } else {
        positionY += gap;
      }
    }
    
    timePoints.push({
      timestamp,
      markerNames: points.map(p => p.label),
      markerKeys: points.map(p => p.key),
      positionY,
      isCut,
      color
    });
  }
  
  return {
    timePoints
  };
}
export default withTheme()(class MarkerTimeline extends Component<Props, State> {
  static defaultProps = {
    lineHeight: 22,
    maxGap: 100
  };

  static getDerivedStateFromProps = MarkerTimeline_getDerivedStateFromProps

  state: State = {
    timePoints: []
  };

  render() {
    const {
      timePoints
    } = this.state;
    const {
      onClick,
      lineHeight,
      points
    } = this.props;

    if (!points || points.length === 0) {
      return null;
    }

    return <Markers totalTime={timePoints[timePoints.length - 1].positionY + lineHeight}>
        {timePoints.map((p: TimePoint, i: number) => {
        return <Point key={i} threadColor={p.color} cut={p.isCut} title={p.markerNames.length > 1 ? p.markerNames.join(', ') : null} positionY={p.positionY} onClick={onClick ? () => onClick(p.markerKeys) : undefined} selected={p.markerKeys.includes(this.props.selected)} number={p.markerNames.length > 1 ? p.markerNames.length : null}>
              <Time>{p.timestamp}ms</Time>{' '}
              <Code code>{p.markerNames.join(', ')}</Code>
            </Point>;
      })}
      </Markers>;
  }

})
