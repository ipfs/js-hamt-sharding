import * as murmur128 from "@multiformats/murmur3/murmur128.js"
import { createHAMT, Bucket } from "./dist/src/index.js"
import SparseArray from "sparse-array"
import { fromString as utf8Encode } from 'uint8arrays/from-string'
import * as BitField from "./src/bitfield.js"
export const hash = (key) =>
  murmur128.encode(utf8Encode(key))
    // Murmur3 outputs 128 bit but, accidentally, IPFS Go's
    // implementation only uses the first 64, so we must do the same
    // for parity..
    .slice(0, 8)
    // Invert buffer because that's how Go impl does it
    .reverse()

export const hashFn = (key) =>
  murmur128.encode(key)
    // Murmur3 outputs 128 bit but, accidentally, IPFS Go's
    // implementation only uses the first 64, so we must do the same
    // for parity..
    .slice(0, 8)
    // Invert buffer because that's how Go impl does it
    .reverse()

export { SparseArray }
export { BitField }




function getByteSize(num) {
    let out = num >> 3;
    if (num % 8 !== 0) out++;
    return out;
}

Object.assign(globalThis, {
  SparseArray,
  BitField,
  utf8Encode,
  Bucket,
  createHAMT,
  hash,
  hashFn,
  arr: new SparseArray(),
  bitfield: BitField.create(128, 8),
  getByteSize,
  hamt: createHAMT({ hashFn })
})
