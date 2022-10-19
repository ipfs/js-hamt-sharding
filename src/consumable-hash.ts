import { ConsumableBuffer } from "./consumable-buffer.js"
import { concat as uint8ArrayConcat } from "uint8arrays/concat"
// import * as Buffer from "./buffer.js"

export type HashFn = (input: Uint8Array) => Uint8Array

export const wrapHash =
  (hashFn: HashFn) => (value: InfiniteHash | Uint8Array) => {
    if (value instanceof InfiniteHash) {
      // already a hash. return it
      return value
    } else {
      return new InfiniteHash(value, hashFn)
    }
  }

export class InfiniteHash {
  _value: Uint8Array
  _hashFn: HashFn
  _depth: number
  _availableBits: number
  _currentBufferIndex: number
  _buffers: ConsumableBuffer[]

  constructor(value: Uint8Array, hashFn: (value: Uint8Array) => Uint8Array) {
    if (!(value instanceof Uint8Array)) {
      throw new Error("can only hash Uint8Arrays")
    }

    this._value = value
    this._hashFn = hashFn
    this._depth = -1
    this._availableBits = 0
    this._currentBufferIndex = 0
    this._buffers = []
  }

  take(bits: number) {
    let pendingBits = bits

    while (this._availableBits < pendingBits) {
      this._produceMoreBits()
    }

    let result = 0

    while (pendingBits > 0) {
      const hash = this._buffers[this._currentBufferIndex]
      const available = Math.min(hash.availableBits(), pendingBits)
      const took = hash.take(available)
      result = (result << available) + took
      pendingBits -= available
      this._availableBits -= available

      if (hash.availableBits() === 0) {
        this._currentBufferIndex++
      }
    }

    return result
  }

  /**
   * @deprecated
   * @param bits
   */

  untake(bits: number) {
    let pendingBits = bits

    while (pendingBits > 0) {
      const hash = this._buffers[this._currentBufferIndex]
      const availableForUntake = Math.min(
        hash.totalBits() - hash.availableBits(),
        pendingBits
      )
      hash.untake(availableForUntake)
      pendingBits -= availableForUntake
      this._availableBits += availableForUntake

      if (
        this._currentBufferIndex > 0 &&
        hash.totalBits() === hash.availableBits()
      ) {
        this._depth--
        this._currentBufferIndex--
      }
    }
  }

  _produceMoreBits() {
    this._depth++

    const value = this._depth
      ? uint8ArrayConcat([this._value, Uint8Array.from([this._depth])])
      : this._value
    const hashValue = this._hashFn(value)
    const buffer = new ConsumableBuffer(hashValue)

    this._buffers.push(buffer)
    this._availableBits += buffer.availableBits()
  }
}

// export class InfiniteHash {
//   private hash: HashFn
//   private buffer: Buffer.View
//   private depth: number
//   constructor(hash: HashFn) {
//     this.hash = hash
//     this.buffer = Buffer.empty()
//     this.depth = -1
//   }
//   read(offset: number, count: number) {
//     let pendingBits = count
//     const endOffset = offset + count

//     while (this.buffer.length < endOffset) {
//       this.produceMoreBits()
//     }

//     let digest = 0
//     while (pendingBits > 0) {}
//   }
//   get size() {
//     return this.buffer.length
//   }
//   grow(size) {
//     if (this.size < size) {
//     }
//     const
//   }
// }
