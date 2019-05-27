
import {
  CancelFrame,
  ConnectionStatus,
  DuplexConnection,
  Frame,
  FrameWithData,
  Payload,
  Responder,
  PartialResponder,
  ReactiveSocket,
  RequestFnfFrame,
  RequestNFrame,
  RequestResponseFrame,
  RequestStreamFrame,
  RequestChannelFrame
} from "rsocket-types"
import { ISubject, ISubscription, IPartialSubscriber } from "rsocket-types"
import { PayloadSerializers } from "./RSocketSerialization"

type Role = "CLIENT" | "SERVER"

export interface RSocketMachine<D, M> extends ReactiveSocket<D, M> {
  setRequestHandler: (requestHandler: PartialResponder<D, M> | null | undefined) => void
}
export function createServerMachine<D, M>(
  connection: DuplexConnection,
  connectionPublisher: (partialSubscriber: IPartialSubscriber<Frame>) => void,
  serializers?: PayloadSerializers<D, M> | null | undefined,
  requestHandler?: PartialResponder<D, M> | null | undefined
): RSocketMachine<D, M>
export function createClientMachine<D, M>(
  connection: DuplexConnection,
  connectionPublisher: (partialSubscriber: IPartialSubscriber<Frame>) => void,
  serializers?: PayloadSerializers<D, M> | null | undefined,
  requestHandler?: PartialResponder<D, M> | null | undefined
): RSocketMachine<D, M>

