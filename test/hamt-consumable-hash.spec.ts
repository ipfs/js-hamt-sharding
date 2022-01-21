/* eslint-env mocha */
import { expect } from 'aegir/utils/chai.js'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import * as murmur3128 from '@multiformats/murmur3/murmur128.js'
import { wrapHash, InfiniteHash } from '../src/consumable-hash.js'

describe('HAMT: consumable hash', () => {
  const val = uint8ArrayFromString('some value')
  let hash: (value: Uint8Array | InfiniteHash) => InfiniteHash

  beforeEach(() => {
    hash = wrapHash(hashFn)
  })

  it('should refuse to hash a non String or buffer', () => {
    try {
      // @ts-expect-error not a string or Uint8Array
      hash(1)

      throw new Error('Should have refused to hash value')
    } catch (err) {
      expect(String(err)).to.include('can only hash Uint8Arrays')
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

const hashFn = function (value: string | Uint8Array) {
  const bytes = value instanceof Uint8Array ? value : uint8ArrayFromString(value)
  return murmur3128.encode(bytes)
}

