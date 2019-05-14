/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
function isObject(val: {}): boolean {
  return Boolean(val) && typeof val === 'object' && Object.prototype.toString.call(val) === '[object Object]';
}

export default function assignDeep<T extends object = any, K extends keyof T = any>(base: T, ...reduces: Array<Partial<T>>): T {
  base = {...base};

  for (const reduce of reduces) {
    for (const key of Object.keys(reduce) as Array<K>) {
      const baseVal = base[key];
      const val = reduce[key];

      if (isObject(val) && isObject(baseVal)) {
        base[key] = assignDeep(baseVal as any, val);
      } else if (typeof val === 'undefined') {
        delete base[key];
      } else {
        base[key] = val;
      }
    }
  }

  return base;
}
