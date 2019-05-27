
import { IPublisher, ISubscriber, IPartialSubscriber, ISubscription } from "rsocket-types"

export type Source<T> = (subscriber: ISubscriber<T>) => void
/**
 * Implements the ReactiveStream `Publisher` interface with Rx-style operators.
 */

export default class Flowable<T> implements IPublisher<T> {

  static just<U>(...values: Array<U>): Flowable<U>

  static error<U>(error: Error): Flowable<U>

  static never<U>(): Flowable<U>

  constructor(source: Source<T>, max?: number)

  subscribe(subscriberOrCallback?: (IPartialSubscriber<T> | ((a: T) => void)) | null): void

  lift<R>(onSubscribeLift: (subscriber: ISubscriber<R>) => ISubscriber<T>): Flowable<R>

  map<R>(fn: (data: T) => R): Flowable<R>

  take(toTake: number): Flowable<T>

}
