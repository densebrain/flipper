/* eslint-disable consistent-return, no-bitwise */

import {Frame} from "rsocket-types"
import {Encoders} from "./RSocketEncoding"


/**
 * Reads a frame from a buffer that is prefixed with the frame length.
 */

export function deserializeFrameWithLength(buffer: Buffer, encoders?: Encoders<any> | null | undefined): Frame
/**
 * Given a buffer that may contain zero or more length-prefixed frames followed
 * by zero or more bytes of a (partial) subsequent frame, returns an array of
 * the frames and a buffer of the leftover bytes.
 */

export function deserializeFrames(buffer: Buffer, encoders?: Encoders<any> | null | undefined): [Array<Frame>, Buffer]
/**
 * Writes a frame to a buffer with a length prefix.
 */

export function serializeFrameWithLength(frame: Frame, encoders?: Encoders<any> | null | undefined): Buffer
/**
 * Read a frame from the buffer.
 */

export function deserializeFrame(buffer: Buffer, encoders?: Encoders<any> | null | undefined): Frame
/**
 * Convert the frame to a (binary) buffer.
 */

export function serializeFrame(frame: Frame, encoders?: Encoders<any> | null | undefined): Buffer
