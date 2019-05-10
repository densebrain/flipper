/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import styled from './StyledCustom';
import { StyleMakerFn } from './StyleTypes';
export function styleCreator<Props extends any>(fn: StyleMakerFn<Props>, filterProps: Array<string> = []): StyleMakerFn<Props> {
  fn.filterProps = filterProps;
  return fn;
}
export default styled;
