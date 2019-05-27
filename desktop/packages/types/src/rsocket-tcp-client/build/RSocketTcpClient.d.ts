import {ConnectionStatus, DuplexConnection, Frame} from "rsocket-types"
import * as net from 'net'
import * as tls from 'tls'
import {Encoders} from "rsocket-core"
import {Flowable} from "rsocket-flowable"

/**
 * A TCP transport client for use in node environments.
 */

export class RSocketTcpConnection implements DuplexConnection {
  
  constructor(socket: net.Socket | null | undefined, encoders: Encoders<any> | null | undefined)

  close(): void

  connect(): void

  setupSocket(socket: net.Socket): void

  connectionStatus(): Flowable<ConnectionStatus>

  receive(): Flowable<Frame>

  sendOne(frame: Frame): void

  send(frames: Flowable<Frame>): void

  getConnectionState(): ConnectionStatus

  setConnectionStatus(status: ConnectionStatus): void

  
}
/**
 * A TCP transport client for use in node environments.
 */

export class RSocketTcpClient extends RSocketTcpConnection {
  
  constructor(options: net.NetConnectOpts, encoders: Encoders<any> | null | undefined)

  connect(): void

}
/**
 * A TLS transport client for use in node environments.
 */

export class RSocketTlsClient extends RSocketTcpConnection {

  constructor(options: tls.ConnectionOptions, encoders: Encoders<any> | null | undefined)

  connect(): undefined


}
