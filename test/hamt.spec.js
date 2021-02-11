/* eslint-env mocha */
'use strict'

const { expect } = require('aegir/utils/chai')
const multihashing = require('multihashing-async')
const uint8ArrayFromString = require('uint8arrays/from-string')

const { createHAMT } = require('..')

/**
 * @template T
 * @typedef {import('../src').Bucket<T>} Bucket<T>
 */

/**
 * @param {string | Uint8Array} value
 */
const hashFn = async function (value) {
  const multihash = await multihashing(value instanceof Uint8Array ? value : uint8ArrayFromString(value), 'sha2-256')

  // remove the multihash identifier
  return multihash.slice(2)
}

const options = {
  hashFn: hashFn
}

describe('HAMT', () => {
  describe('basic', () => {
    /** @type {Bucket<string>} */
    let bucket

    beforeEach(() => {
      bucket = createHAMT(options)
    })

    it('should require a hash function', () => {
      try {
        // @ts-ignore options are not optional
        createHAMT()

        throw new Error('Should have required a hash function')
      } catch (err) {
        expect(err.message).to.include('please define an options.hashFn')
      }
    })

    it('should require a hash function with options', () => {
      try {
        // @ts-ignore hashFn is required
        createHAMT({})

        throw new Error('Should have required a hash function')
      } catch (err) {
        expect(err.message).to.include('please define an options.hashFn')
      }
    })

    it('get unknown key returns undefined', async () => {
      const result = await bucket.get('unknown')

      expect(result).to.be.undefined()
    })

    it('can get and put a value', async () => {
      const key = 'key'
      const value = 'value'

      await bucket.put(key, value)

      const result = await bucket.get(key)

      expect(result).to.eql(value)
    })

    it('can override a value', async () => {
      const key = 'key'
      const value = 'value'
      const secondValue = 'other value'

      await bucket.put(key, value)
      await bucket.put(key, secondValue)

      const result = await bucket.get(key)

      expect(result).to.eql(secondValue)
    })

    it('can remove a non existing value', async () => {
      await bucket.del('a key which does not exist')
    })

    it('can remove an existing value', async () => {
      const key = 'key'
      const value = 'value'

      await bucket.put(key, value)
      await bucket.del('key')
    })

    it('get deleted key returns undefined', async () => {
      const key = 'key'
      const value = 'value'

      await bucket.put(key, value)
      await bucket.del('key')

      const result = await bucket.get(key)

      expect(result).to.be.undefined()
    })

    it('should count leaves', async () => {
      expect(bucket.leafCount()).to.eql(0)

      // insert enough keys to cause multiple buckets to be created
      await insertKeys(400, bucket)

      expect(bucket.leafCount()).to.eql(400)
    })

    it('should count children', async () => {
      expect(bucket.leafCount()).to.eql(0)

      // insert enough keys to cause multiple buckets to be created
      await insertKeys(400, bucket)

      expect(bucket.childrenCount()).to.eql(256)
    })

    it('should return the first child', async () => {
      expect(bucket.leafCount()).to.eql(0)

      expect(await bucket.onlyChild()).to.be.undefined()
    })

    it('should iterate over children', async () => {
      const expectedCount = 400
      let childCount = 0

      // insert enough keys to cause multiple buckets to be created
      await insertKeys(expectedCount, bucket)

      for await (const child of bucket.eachLeafSeries()) { // eslint-disable-line no-unused-vars
        childCount++
      }

      expect(childCount).to.equal(expectedCount)
    })
  })

  describe('many keys', () => {
    /** @type {Bucket<string>} */
    let bucket

    beforeEach(() => {
      bucket = createHAMT(options)
    })

    it('accepts putting many keys', async () => {
      const keys = Array.from({ length: 400 }, (_, i) => i.toString())

      for (const key of keys) {
        await bucket.put(key, key)
      }
    })

    it('accepts putting many keys in parallel', async () => {
      const keys = Array.from({ length: 400 }, (_, i) => i.toString())

      await Promise.all(keys.map(key => bucket.put(key, key)))
    })

    it('can remove all the keys and still find remaining', async function () {
      this.timeout(50 * 1000)

      const keys = await insertKeys(400, bucket)

      const masterHead = keys.pop()

      if (!masterHead) {
        throw new Error('masterHead not found')
      }

      for (const head of keys.reverse()) {
        expect(await bucket.get(head)).to.eql(head)

        await bucket.del(head)

        expect(await bucket.get(head)).to.be.undefined()
      }

      // collapsed all the buckets
      expect(bucket.toJSON()).to.be.eql([masterHead])

      // can still find sole head
      const value = await bucket.get(masterHead)

      expect(value).to.be.eql(masterHead)
    })
  })

  describe('exhausting hash', () => {
    /** @type {Bucket<string>} */
    let bucket

    beforeEach(() => {
      bucket = createHAMT({
        hashFn: smallHashFn,
        bits: 2
      })
    })

    it('iterates', async () => {
      await insertKeys(400, bucket)
    })

    /**
     * @param {string | Uint8Array} value
     */
    async function smallHashFn (value) {
      const hash = await hashFn(value)
      return hash.slice(0, 2) // just return the 2 first bytes of the hash
    }
  })
})

/**
 * @param {number} count
 * @param {Bucket<string>} bucket
 */
async function insertKeys (count, bucket) {
  const keys = Array.from({ length: count }, (_, i) => i.toString())

  for (const key of keys) {
    await bucket.put(key, key)
  }

  return keys
}
