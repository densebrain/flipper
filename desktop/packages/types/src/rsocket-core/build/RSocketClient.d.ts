import { ConnectionStatus, DuplexConnection, Payload, ReactiveSocket, SetupFrame, Responder } from "rsocket-types"
import { PayloadSerializers } from "./RSocketSerialization"
import { Flowable, Single, every } from "rsocket-flowable"

export type ClientConfig<D, M> = {
  serializers?: PayloadSerializers<D, M>
  setup: {
    dataMimeType: string
    keepAlive: number
    lifetime: number
    metadataMimeType: string
  }
  transport: DuplexConnection
  responder?: Responder<D, M>
}
/**
 * RSocketClient: A client in an RSocket connection that will communicates with
 * the peer via the given transport client. Provides methods for establishing a
 * connection and initiating the RSocket interactions:
 * - fireAndForget()
 * - requestResponse()
 * - requestStream()
 * - requestChannel()
 * - metadataPush()
 */

export default class RSocketClient<D, M> {
  
  constructor(config: ClientConfig<D, M>)

  close(): undefined

  connect(): Single<ReactiveSocket<D, M>>
}
