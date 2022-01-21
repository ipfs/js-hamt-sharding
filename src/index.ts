import { Bucket } from './bucket.js'
import type { BucketOptions, BucketPosition, BucketChild } from './bucket.js'
import { wrapHash, HashFn } from './consumable-hash.js'

interface UserBucketOptions {
  hashFn: HashFn
  bits?: number
}

export function createHAMT<T> (options: UserBucketOptions) {
  if (!options || !options.hashFn) {
    throw new Error('please define an options.hashFn')
  }

  const bucketOptions = {
    bits: options.bits || 8,
    hash: wrapHash(options.hashFn)
  }

  return new Bucket<T>(bucketOptions)
}

export { Bucket }
export type { BucketOptions, BucketPosition, BucketChild }
