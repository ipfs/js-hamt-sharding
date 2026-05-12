/**
 * @packageDocumentation
 *
 * A [Hash Mapped Trie](https://en.wikipedia.org/wiki/Hash_array_mapped_trie) implementation for JavaScript.
 *
 * This is used by [@helia/unixfs](https://www.npmjs.com/package/@helia/unixfs) for it's HAMT-sharded directory implementation.
 *
 * @example
 *
 * ```TypeScript
 * import { createHAMT } from 'hamt-sharding'
 * import crypto from 'crypto-promise'
 *
 * // decide how to hash buffers made from keys, can return a Promise
 * const hashFn = async (buf) => {
 *   return crypto
 *     .createHash('sha256')
 *     .update(buf)
 *     .digest()
 * }
 *
 * const bucket = createHAMT({
 *   hashFn: hashFn
 * })
 *
 * await bucket.put('key', 'value')
 *
 * const output = await bucket.get('key')
 * // output === 'value'
 * ```
 */

import { Bucket } from './bucket.ts'
import { wrapHash } from './consumable-hash.ts'
import type { BucketPosition, BucketChild } from './bucket.ts'

export type { ConsumableBuffer } from './consumable-buffer.ts'
export type { InfiniteHash } from './consumable-hash.ts'

export interface BucketOptions {
  hashFn(value: Uint8Array): Promise<Uint8Array>
  bits?: number
}

export function createHAMT<T> (options: BucketOptions): Bucket<T> {
  if (options == null || options.hashFn == null) {
    throw new Error('please define an options.hashFn')
  }

  const bucketOptions = {
    bits: options.bits ?? 8,
    hash: wrapHash(options.hashFn)
  }

  return new Bucket<T>(bucketOptions)
}

export { Bucket }
export type { BucketPosition, BucketChild }
