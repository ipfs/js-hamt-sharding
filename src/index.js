'use strict'

const Bucket = require('./bucket')
const wrapHash = require('./consumable-hash')

/**
 * @typedef {object} UserBucketOptions
 * @property {(value: string | Uint8Array) => Promise<Uint8Array>} hashFn
 * @property {number} [bits=8]
 */

/**
 * @param {UserBucketOptions} options
 */
module.exports = function createHAMT (options) {
  if (!options || !options.hashFn) {
    throw new Error('please define an options.hashFn')
  }

  const bucketOptions = {
    bits: options.bits || 8,
    hash: wrapHash(options.hashFn)
  }

  return new Bucket(bucketOptions)
}

module.exports.isBucket = Bucket.isBucket
module.exports.Bucket = Bucket
