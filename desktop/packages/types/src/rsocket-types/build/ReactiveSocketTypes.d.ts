/**
 * Copyright 2019-present Densebrain.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Copyright 2019-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { Flowable, Single } from "rsocket-flowable"

export interface Responder<D, M> {
  fireAndForget: (payload: Payload<D, M>) => void
  requestResponse: (payload: Payload<D, M>) => Single<Payload<D, M>>
  requestStream: (payload: Payload<D, M>) => Flowable<Payload<D, M>>
  requestChannel: (payloads: Flowable<Payload<D, M>>) => Flowable<Payload<D, M>>
  metadataPush: (payload: Payload<D, M>) => Single<void>
}

export interface PartialResponder<D, M> {
  fireAndForget?: (payload: Payload<D, M>) => void
  requestResponse?: (payload: Payload<D, M>) => Single<Payload<D, M>>
  requestStream?: (payload: Payload<D, M>) => Flowable<Payload<D, M>>
  requestChannel?: (
    payloads: Flowable<Payload<D, M>>
  ) => Flowable<Payload<D, M>>
  metadataPush?: (payload: Payload<D, M>) => Single<void>
}

/**
 * A contract providing different interaction models per the [ReactiveSocket protocol]
 (https://github.com/ReactiveSocket/reactivesocket/blob/master/Protocol.md).
 */

export interface ReactiveSocket<D, M> extends Responder<D, M> {
  close: () => void
  connectionStatus: () => Flowable<ConnectionStatus>
}

/**
 * Represents a network connection with input/output used by a ReactiveSocket to
 * send/receive data.
 */

export interface DuplexConnection {
  sendOne: (frame: Frame) => void
  send: (input: Flowable<Frame>) => void
  receive: () => Flowable<Frame>
  close: () => void
  connect: () => void
  connectionStatus: () => Flowable<ConnectionStatus>
}

/**
 * Describes the connection status of a ReactiveSocket/DuplexConnection.
 * - NOT_CONNECTED: no connection established or pending.
 * - CONNECTING: when `connect()` has been called but a connection is not yet
 *   established.
 * - CONNECTED: when a connection is established.
 * - CLOSED: when the connection has been explicitly closed via `close()`.
 * - ERROR: when the connection has been closed for any other reason.
 */

export type ConnectionStatus =
  | {
      kind: "NOT_CONNECTED"
    }
  | {
      kind: "CONNECTING"
    }
  | {
      kind: "CONNECTED"
    }
  | {
      kind: "CLOSED"
    }
  | {
      kind: "ERROR"
      error: Error
    }

export const CONNECTION_STATUS: {
  CLOSED: ConnectionStatus
  CONNECTED: ConnectionStatus
  CONNECTING: ConnectionStatus
  NOT_CONNECTED: ConnectionStatus
}
/**
 * A type that can be written to a buffer.
 */

export type Encodable = string | Buffer | Uint8Array
/**
 * A single unit of data exchanged between the peers of a `ReactiveSocket`.
 */

export type Payload<D, M> = {
  data: D | null | undefined
  metadata?: M | null | undefined
}
export type Frame =
  | CancelFrame
  | ErrorFrame
  | KeepAliveFrame
  | LeaseFrame
  | PayloadFrame
  | RequestChannelFrame
  | RequestFnfFrame
  | RequestNFrame
  | RequestResponseFrame
  | RequestStreamFrame
  | ResumeFrame
  | ResumeOkFrame
  | SetupFrame
  | UnsupportedFrame
export type FrameWithData = {
  data:Encodable | null | undefined;
  metadata:Encodable | null | undefined;
}; // prettier-ignore

export type CancelFrame = {
  type:9;
  flags:number;
  streamId:number;
}; // prettier-ignore

export type ErrorFrame = {
  type:11;
  flags:number;
  code:number;
  message:string;
  streamId:number;
}; // prettier-ignore

export type KeepAliveFrame = {
  type:3;
  flags:number;
  data:Encodable | null | undefined;
  lastReceivedPosition:number;
  streamId:0;
}; // prettier-ignore

export type LeaseFrame = {
  type:2;
  flags:number;
  ttl:number;
  requestCount:number;
  metadata:Encodable | null | undefined;
  streamId:0;
}; // prettier-ignore

export type PayloadFrame = {
  type:10;
  flags:number;
  data:Encodable | null | undefined;
  metadata:Encodable | null | undefined;
  streamId:number;
}; // prettier-ignore

export type RequestChannelFrame = {
  type:7;
  data:Encodable | null | undefined;
  metadata:Encodable | null | undefined;
  flags:number;
  requestN:number;
  streamId:number;
}; // prettier-ignore

export type RequestFnfFrame = {
  type:5;
  data:Encodable | null | undefined;
  metadata:Encodable | null | undefined;
  flags:number;
  streamId:number;
}; // prettier-ignore

export type RequestNFrame = {
  type:8;
  flags:number;
  requestN:number;
  streamId:number;
}; // prettier-ignore

export type RequestResponseFrame = {
  type:4;
  data:Encodable | null | undefined;
  metadata:Encodable | null | undefined;
  flags:number;
  streamId:number;
}; // prettier-ignore

export type RequestStreamFrame = {
  type:6;
  data:Encodable | null | undefined;
  metadata:Encodable | null | undefined;
  flags:number;
  requestN:number;
  streamId:number;
}; // prettier-ignore

export type ResumeFrame = {
  type:13;
  clientPosition:number;
  flags:number;
  majorVersion:number;
  minorVersion:number;
  resumeToken:Encodable;
  serverPosition:number;
  streamId:0;
}; // prettier-ignore

export type ResumeOkFrame = {
  type:14;
  clientPosition:number;
  flags:number;
  streamId:0;
}; // prettier-ignore

export type SetupFrame = {
  type:1;
  data:Encodable | null | undefined;
  dataMimeType:string;
  flags:number;
  keepAlive:number;
  lifetime:number;
  metadata:Encodable | null | undefined;
  metadataMimeType:string;
  resumeToken:Encodable | null | undefined;
  streamId:0;
  majorVersion:number;
  minorVersion:number;
}; // prettier-ignore

export type UnsupportedFrame = {
  type: 63 | 12 | 0
  streamId: 0
  flags: number
}
