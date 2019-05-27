/* eslint-disable max-len, no-bitwise */

import { ErrorFrame, Frame } from "rsocket-types"
export const CONNECTION_STREAM_ID = 0
export const FRAME_TYPES:{[key: string]: number}
export const FRAME_TYPE_NAMES:{[key: string]: string}

export const FLAGS:{[key: string]: number}

export const ERROR_CODES:{[key: string]: number}

export const ERROR_EXPLANATIONS:{[key: string]: string}

export const FLAGS_MASK = 0x3ff // low 10 bits

export const FRAME_TYPE_OFFFSET = 10 // frame type is offset 10 bytes within the uint16 containing type + flags

export const MAX_CODE = 0x7fffffff // uint31

export const MAX_KEEPALIVE = 0x7fffffff // uint31

export const MAX_LIFETIME = 0x7fffffff // uint31

export const MAX_METADATA_LENGTH = 0xffffff // uint24

export const MAX_MIME_LENGTH = 0xff // int8

export const MAX_REQUEST_COUNT = 0x7fffffff // uint31

export const MAX_REQUEST_N = 0x7fffffff // uint31

export const MAX_RESUME_LENGTH = 0xffff // uint16

export const MAX_STREAM_ID = 0x7fffffff // uint31

export const MAX_TTL = 0x7fffffff // uint31

export const MAX_VERSION = 0xffff // uint16

/**
 * Returns true iff the flags have the IGNORE bit set.
 */

export function isIgnore(flags: number): boolean
/**
 * Returns true iff the flags have the METADATA bit set.
 */

export function isMetadata(flags: number): boolean
/**
 * Returns true iff the flags have the COMPLETE bit set.
 */

export function isComplete(flags: number): boolean
/**
 * Returns true iff the flags have the NEXT bit set.
 */

export function isNext(flags: number): boolean
/**
 * Returns true iff the flags have the RESPOND bit set.
 */

export function isRespond(flags: number): boolean
/**
 * Returns true iff the flags have the RESUME_ENABLE bit set.
 */

export function isResumeEnable(flags: number): boolean
/**
 * Returns true iff the flags have the LEASE bit set.
 */

export function isLease(flags: number): boolean
/**
 * Returns true iff the frame type is counted toward the implied
 * client/server position used for the resumption protocol.
 */

export function isResumePositionFrameType(type: number): boolean
export function getFrameTypeName(type: number): string
/**
 * Constructs an Error object given the contents of an error frame. The
 * `source` property contains metadata about the error for use in introspecting
 * the error at runtime:
 * - `error.source.code: number`: the error code returned by the server.
 * - `error.source.explanation: string`: human-readable explanation of the code
 *   (this value is not standardized and may change).
 * - `error.source.message: string`: the error string returned by the server.
 */

export function createErrorFromFrame(frame: ErrorFrame): Error
/**
 * Given a RSocket error code, returns a human-readable explanation of that
 * code, following the names used in the protocol specification.
 */

export function getErrorCodeExplanation(code: number): string
/**
 * Pretty-prints the frame for debugging purposes, with types, flags, and
 * error codes annotated with descriptive names.
 */

export function printFrame(frame: Frame): string

