
import {
  DuplexConnection,
  FrameWithData,
  IPartialSubscriber,
  ISubscriber,
  ISubscription,
  PartialResponder,
  Payload,
  ReactiveSocket
} from "rsocket-types"
import {PayloadSerializers} from "./RSocketSerialization"
import {Flowable} from "rsocket-flowable"

export interface TransportServer {
  start: () => Flowable<DuplexConnection>
  stop: () => void
}
export type ServerConfig<D, M> = {
  getRequestHandler: (socket: ReactiveSocket<D, M>, payload: Payload<D, M>) => PartialResponder<D, M>
  serializers?: PayloadSerializers<D, M>
  transport: TransportServer
}
/**
 * RSocketServer: A server in an RSocket connection that accepts connections
 * from peers via the given transport server.
 */

export default class RSocketServer<D, M> {
  constructor(config: ServerConfig<D, M>)

  start(): void

  stop(): void

  
}
