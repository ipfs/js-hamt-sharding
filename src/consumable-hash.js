'use strict'

const ConsumableBuffer = require('./consumable-buffer')
const uint8ArrayConcat = require('uint8arrays/concat')
const uint8ArrayFromString = require('uint8arrays/from-string')

/**
 * @param {(value: string | Uint8Array) => Promise<Uint8Array>} hashFn
 */
function wrapHash (hashFn) {
  /**
   * @param {InfiniteHash | Uint8Array | string} value
   */
  function hashing (value) {
    if (value instanceof InfiniteHash) {
      // already a hash. return it
      return value
    } else {
      return new InfiniteHash(value, hashFn)
    }
  }

  return hashing
}

class InfiniteHash {
  /**
   *
   * @param {string | Uint8Array} value
   * @param {(value: string | Uint8Array) => Promise<Uint8Array>} hashFn
   */
  constructor (value, hashFn) {
    if (value instanceof Uint8Array) {
      this._value = value
    } else if (typeof value === 'string') {
      this._value = uint8ArrayFromString(value)
    } else {
      throw new Error('can only hash strings or buffers')
    }

    this._hashFn = hashFn
    this._depth = -1
    this._availableBits = 0
    this._currentBufferIndex = 0

    /** @type {ConsumableBuffer[]} */
    this._buffers = []
  }

  /**
   * @param {number} bits
   */
  async take (bits) {
    let pendingBits = bits

    while (this._availableBits < pendingBits) {
      await this._produceMoreBits()
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
   * @param {number} bits
   */
  untake (bits) {
    let pendingBits = bits

    while (pendingBits > 0) {
      const hash = this._buffers[this._currentBufferIndex]
      const availableForUntake = Math.min(hash.totalBits() - hash.availableBits(), pendingBits)
      hash.untake(availableForUntake)
      pendingBits -= availableForUntake
      this._availableBits += availableForUntake

      if (this._currentBufferIndex > 0 && hash.totalBits() === hash.availableBits()) {
        this._depth--
        this._currentBufferIndex--
      }
    }
  }

  async _produceMoreBits () {
    this._depth++

    const value = this._depth ? uint8ArrayConcat([this._value, Uint8Array.from([this._depth])]) : this._value
    const hashValue = await this._hashFn(value)
    const buffer = new ConsumableBuffer(hashValue)

    this._buffers.push(buffer)
    this._availableBits += buffer.availableBits()
  }
}

module.exports = wrapHash
module.exports.InfiniteHash = InfiniteHash
