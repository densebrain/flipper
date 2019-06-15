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

//import {Messenger} from "./Messenger"
//import { Option } from "prelude-ts"
//import { stato as Models } from "@stato/models"
// export interface EnvelopePayloadConstructor<T> {
//   new (patch: Partial<T>): T
// }
//
//
// export interface Envelope<Payload extends string | any = string> {
//   method: string
//   requestId: string
//   nodeId: string
//   appPackage: string
//   connectionId: string
//   isError: boolean
//   isResponse: boolean
//   payload: Payload
// }
//
// export class EncodedEnvelope implements Envelope<string> {
//   method = ""
//   requestId = ""
//   nodeId = ""
//   appPackage = ""
//   connectionId = ""
//   isError = false
//   isResponse = false
//   payload = ""
//
//   constructor(patch: Partial<Envelope<string>> = {}) {
//     Object.assign(this, patch)
//   }
// }
//
// export class ReadyEnvelope<T extends any = any> implements Envelope<T> {
//   method = ""
//   requestId = ""
//   nodeId = ""
//   appPackage = ""
//   connectionId = ""
//   isError = false
//   isResponse = false
//   payload: T
//
//   constructor(patch: Partial<Envelope<T>>)
//   constructor(payload: T, patch: Partial<Envelope<T>>)
//   constructor(
//     payload: T | Partial<Envelope<string>>,
//     patch: Partial<Envelope<string>> | null = null
//   ) {
//     Object.assign(
//       this,
//       !patch
//         ? payload
//         : {
//             ...patch,
//             payload
//           }
//     )
//   }
//
//   toSuccessOption(): Option<true> {
//     return toTrueOption(this.isError || this.method === "error" ? null : true)
//   }
//
//   encode(): EncodedEnvelope {
//     return new EncodedEnvelope({
//       ...this,
//       payload: JSON.stringify(this.payload)
//     })
//   }
// }


