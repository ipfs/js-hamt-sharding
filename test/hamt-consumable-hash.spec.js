/* eslint-env mocha */
'use strict'

const { expect } = require('aegir/utils/chai')
const multihashing = require('multihashing-async')
const { fromString: uint8ArrayFromString } = require('uint8arrays/from-string')

const wrapHash = require('../src/consumable-hash')

/**
 * @typedef {import('../src/consumable-hash').InfiniteHash} InfiniteHash
 */

describe('HAMT: consumable hash', () => {
  const val = uint8ArrayFromString('some value')
  /** @type {(value: Uint8Array | InfiniteHash) => InfiniteHash} */
  let hash

  beforeEach(() => {
    hash = wrapHash(hashFn)
  })

  it('should refuse to hash a non String or buffer', () => {
    try {
      // @ts-expect-error not a string or Uint8Array
      hash(1)

      throw new Error('Should have refused to hash value')
    } catch (err) {
      expect(err.message).to.include('can only hash Uint8Arrays')
    }
  })

  it('can take a 0 length value', async () => {
    const result = await hash(val).take(0)

    expect(result).to.be.eql(0)
  })

  it('can take a 10 bit value', async () => {
    const result = await hash(val).take(10)

    expect(result).to.be.eql(110)
  })

  it('can keep on taking a 10 bit value', async () => {
    let iter = 100
    const h = hash(val)

    while (iter > 0) {
      const result = await h.take(10)

      expect(result).to.be.below(1024)
      expect(result).to.be.above(0)
      iter--
    }
  })

  it('can untake all', async () => {
    const h = hash(val)

    await h.take(10 * 100)

    h.untake(10 * 100)
  })

  it('keeps taking the same values after untaking all', async () => {
    let iter = 100
    const values = []
    const h = hash(val)

    while (iter > 0) {
      values.push(await h.take(10))
      iter--
    }

    h.untake(10 * 100)

    while (iter > 0) {
      const result = h.take(10)

      values.push(result)
      expect(result).to.be.eql(values.shift())
      iter--
    }
  })
})

/**
 * @param {string | Uint8Array} value
 */
async function hashFn (value) {
  const multihash = await multihashing(value instanceof Uint8Array ? value : uint8ArrayFromString(value), 'sha2-256')

  // remove the multihash identifier
  return multihash.slice(2)
}
