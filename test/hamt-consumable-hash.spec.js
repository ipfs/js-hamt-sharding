/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const crypto = require('crypto')

const ConsumableHash = require('../src/consumable-hash')

describe('HAMT: consumable hash', () => {
  let hash, h

  beforeEach(() => {
    hash = ConsumableHash(hashFn)
  })

  it('should refuse to hash a non String or buffer', () => {
    try {
      hash(1)

      throw new Error('Should have refused to hash value')
    } catch (err) {
      expect(err.message).to.include('can only hash strings or buffers')
    }
  })

  it('can take a 0 length value', async () => {
    const result = await hash('some value').take(0)

    expect(result).to.be.eql(0)
  })

  it('can take a 10 bit value', async () => {
    const result = await hash('some value').take(10)

    expect(result).to.be.eql(110)
  })

  it('can keep on taking a 10 bit value', async () => {
    let iter = 100
    const h = hash('some value')

    while(iter > 0) {
      const result = await h.take(10)

      expect(result).to.be.below(1024)
      expect(result).to.be.above(0)
      iter--
    }
  })

  it('can untake all', async () => {
    const h = hash('some value')

    await h.take(10 * 100)

    h.untake(10 * 100)
  })

  it('keeps taking the same values after untaking all', async () => {
    let iter = 100
    const values = []
    const h = hash('some value')

    while(iter > 0) {
      values.push(await h.take(10))
      iter--
    }

    h.untake(10 * 100)

    while(iter > 0) {
      const result = h.take(10)

      values.push(result)
      expect(result).to.be.eql(values.shift())
      iter--
    }
  })
})

function hashFn (value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest()
}
