import {IPublisher, ISubscription, ISubscriber, IPartialSubscriber} from "rsocket-types"

export default class FlowableProcessor<T, R> implements IPublisher<R>, ISubscriber<T>, ISubscription {
  
  constructor(source: IPublisher<T>, fn?: (a: T) => R)

  onSubscribe(subscription: ISubscription): this

  onNext(t: T): this

  onError(error: Error): this

  onComplete(): this

  subscribe(subscriber: IPartialSubscriber<R>): void
  
  map<T2>(fn: (data: R) => T2): IPublisher<T2>

  request(n: number): this

  cancel(): this
}
