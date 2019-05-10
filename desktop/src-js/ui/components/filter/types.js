/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
export type FilterType = {
    value: string,
    type: 'include' | 'exclude',
  }
  | {
  value: Array<string>,
  type: 'enum',
  enum: Array<{
    label: string,
    color?: string,
    value: string,
  }>,
  persistent?: boolean,
};

export type Filter<T> = {
    key: string
  } & FilterType;
