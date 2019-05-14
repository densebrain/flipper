export * from "./build/index"

// declare module "rsocket-flowable" {
//    // import * as RSocketFlowable from "./build/index"
//    // export = RSocketFlowable
//    //export = "./build/index"
//    //export = RSocketFlowable
//   import { IPublisher, IPartialSubscriber, ISubscription, ISubscriber } from "rsocket-types"
//
//   //export type Source<T> = (subject: IFutureSubject<T>) => void
//   export type CancelCallback = () => void
//   export interface IPartialFutureSubscriber<T> {
//     onComplete?: (value: T) => void
//     onError?: (error: Error) => void
//     onSubscribe?: (cancel: CancelCallback) => void
//   }
//   export interface IFutureSubscriber<T> {
//     onComplete: (value: T) => void
//     onError: (error: Error) => void
//     onSubscribe: (cancel: CancelCallback) => void
//   }
//   export interface IFutureSubject<T> {
//     onComplete: (value: T) => void
//     onError: (error: Error) => void
//     onSubscribe: (cancel: CancelCallback | null | undefined) => void
//   }
//   /**
//    * Represents a lazy computation that will either produce a value of type T
//    * or fail with an error. Calling `subscribe()` starts the
//    * computation and returns a subscription object, which has an `unsubscribe()`
//    * method that can be called to prevent completion/error callbacks from being
//    * invoked and, where supported, to also cancel the computation.
//    * Implementations may optionally implement cancellation; if they do not
//    * `cancel()` is a no-op.
//    *
//    * Note: Unlike Promise, callbacks (onComplete/onError) may be invoked
//    * synchronously.
//    *
//    * Example:
//    *
//    * ```
//    * const value = new Single(subscriber => {
//    *   const id = setTimeout(
//    *     () => subscriber.onComplete('Hello!'),
//    *     250
//    *   );
//    *   // Optional: Call `onSubscribe` with a cancellation callback
//    *   subscriber.onSubscribe(() => clearTimeout(id));
//    * });
//    *
//    * // Start the computation. onComplete will be called after the timeout
//    * // with 'hello'  unless `cancel()` is called first.
//    * value.subscribe({
//    *   onComplete: value => console.log(value),
//    *   onError: error => console.error(error),
//    *   onSubscribe: cancel => ...
//    * });
//    * ```
//    */
//
//   export class Single<T> {
//     static of<U>(value: U): Single<U>
//
//     static error<U>(error: Error): Single<U>
//
//     constructor(source: Source<T>)
//
//     subscribe(partialSubscriber?: IPartialFutureSubscriber<T> | null | undefined): undefined
//
//     flatMap<R>(fn: (data: T) => Single<R>): Single<R>
//     /**
//      * Return a new Single that resolves to the value of this Single applied to
//      * the given mapping function.
//      */
//
//     map<R>(fn: (data: T) => R): Single<R>
//
//     then(successFn?: (data: T) => void, errorFn?: (error: Error) => void): undefined
//   }
//
//   export function every(ms: number): Flowable<number>
//
//
//   /**
//    * An operator that requests a fixed number of values from its source
//    * `Subscription` and forwards them to its `Subscriber`, cancelling the
//    * subscription when the requested number of items has been reached.
//    */
//
//   export class FlowableTakeOperator<T> implements ISubscriber<T> {
//
//     constructor(subscriber: ISubscriber<T>, toTake: number)
//
//     onComplete(): undefined
//
//     onError(error: Error): undefined
//
//     onNext(t: T): undefined
//
//     onSubscribe(subscription: ISubscription): undefined
//
//   }
//
//
//   export class FlowableRequestOperator<T> implements ISubscriber<T> {
//
//     constructor(subscriber: ISubscriber<T>, toRequest: number)
//
//     onComplete(): undefined
//
//     onError(error: Error): undefined
//
//     onNext(t: T): undefined
//
//     onSubscribe(subscription: ISubscription): undefined
//   }
//
//   export class FlowableMapOperator<T, R> implements ISubscriber<T> {
//
//     constructor(subscriber: ISubscriber<R>, fn: (t: T) => R)
//
//     onComplete(): undefined
//
//     onError(error: Error): undefined
//
//     onNext(t: T): undefined
//
//     onSubscribe(subscription: ISubscription): undefined
//   }
//
//   export class FlowableProcessor<T, R> implements IPublisher<R>, ISubscriber<T>, ISubscription {
//
//     constructor(source: IPublisher<T>, fn?: (a: T) => R)
//
//     onSubscribe(subscription: ISubscription): this
//
//     onNext(t: T): this
//
//     onError(error: Error): this
//
//     onComplete(): this
//
//     subscribe(subscriber: ISubscriber<R>): this
//
//     map<S>(fn: (a: R) => S): this
//
//     request(n: number): this
//
//     cancel(): this
//   }
//
//   export type Source<T> = (subscriber: ISubscriber<T>) => void
//   /**
//    * Implements the ReactiveStream `Publisher` interface with Rx-style operators.
//    */
//
//   export class Flowable<T> implements IPublisher<T> {
//
//     static just<U>(...values: Array<U>): Flowable<U>
//
//     static error<U>(error: Error): Flowable<U>
//
//     static never<U>(): Flowable<U>
//
//     constructor(source: Source<T>, max?: number)
//
//     subscribe(subscriberOrCallback?: (IPartialSubscriber<T> | ((a: T) => void)) | null | undefined): undefined
//
//     lift<R>(onSubscribeLift: (subscriber: ISubscriber<R>) => ISubscriber<T>): Flowable<R>
//
//     map<R>(fn: (data: T) => R): Flowable<R>
//
//     take(toTake: number): Flowable<T>
//
//   }
//   /**
//    * @private
//    */
//
//   export class FlowableSubscriber<T> implements ISubscriber<T> {
//
//     constructor(subscriber?: IPartialSubscriber<T> | null | undefined, max?: number)
//
//     onComplete(): undefined
//
//     onError(error: Error): undefined
//
//     onNext(data: T): undefined
//
//     onSubscribe(subscription?: ISubscription | null | undefined): undefined
//
//   }
//
//
// }
