export type ArgEqualityFn = (newArgs: any[], lastArgs: any[]) => boolean;
export const simpleIsEqual: ArgEqualityFn = (newArgs: {}[], lastArgs: {}[]) => newArgs.length === lastArgs.length && newArgs.every((newArg: {}, index: number): boolean => newArg === lastArgs[index]);
export function memoFn<Fn extends Function>(fn: Fn, equalityFn?: ArgEqualityFn = simpleIsEqual, checkResult: boolean = false): Fn {
  let lastArgs: {}[] = [];
  let called = false;
  let lastResult: any = null;

  const memoFn = (...newArgs: any[]) => {
    let change = true;

    if (called) {
      change = !equalityFn(newArgs, lastArgs);
    } else {
      called = true;
    }

    if (!change) {
      return lastResult;
    } else {
      const newResult = fn(...newArgs);
      lastArgs = [...newArgs];
      return checkResult && equalityFn([lastResult], [newResult]) ? lastResult : lastResult = newResult;
    }
  };

  return (memoFn as any);
}
