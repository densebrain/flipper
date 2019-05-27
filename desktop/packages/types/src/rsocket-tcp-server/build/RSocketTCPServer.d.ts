import {DuplexConnection} from "rsocket-types"
import {Encoders, TransportServer} from "rsocket-core"
import * as net from "net"
import {Flowable} from "rsocket-flowable"

export type ServerOptions = {
  host?: string
  port: number
  serverFactory?: (onConnect: (socket: net.Socket) => void) => net.Server
}
/**
 * A TCP transport server.
 */

export default class RSocketTCPServer implements TransportServer {


  constructor(options: ServerOptions, encoders?: Encoders<any> | null | undefined)

  start(): Flowable<DuplexConnection>

  stop(): undefined
}
