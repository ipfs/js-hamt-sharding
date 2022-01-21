// @ts-ignore

import * as API from "./hamt/api.js"
// import { wrapHash } from "../dist/src/consumable-hash.js"

export { API }

/**
 * @template K, V
 * @param {object} options
 * @param {(key:K) => Uint8Array} options.encode
 * @param {(key:Uint8Array) => Uint8Array} options.hash
 * @param {number} [options.bits]
 * @return {API.HAMT<K, V>}
 */
export const create = ({ hash, encode, bits = 8 }) => ({
  options: { hash: wrapHash(hash), encode, bits },
  children: [],
  popCount: 0
})

/**
 * @template K, V
 * @param {API.Shard<K, V>} self
 * @param {K} key
 * @param {V} value
 */
export const put = (self, key, value) => {
  const hash = self.options.hash(self.options.encode(key))
  const place = findNewShardAndPosition(self, key, hash)

  return putAt(self, place, key, value)
}

/**
 * @template K, V
 * @param {API.Shard<K, V>} self
 * @param {K} key
 * @param {API.InfiniteHash} hash
 * @returns {API.Position<K, V>}
 */
export const findNewShardAndPosition = (
  self,
  key,
  hash = self.options.hash(key)
) => {
  const place = findPlace(self, hash)

  // we have a conflict
  if (place.entry && place.entry.key !== key) {
    const shard = {
      ...self,
      parent: place.shard,
      posAtParent: place.pos
    }
    putChildAt(place.shard, place.pos, shard)

    // put the previous value
    const newPlace = findPlace(shard, place.entry.hash)
    putAt(newPlace.shard, newPlace, place.entry.key, place.entry.value)

    return findNewShardAndPosition(shard, key, place.hash)
  }
  // no conflict, we found the place
  else {
    return place
  }
}

/**
 * @template K, V
 * @param {API.Child<K, V>} child
 * @returns {child is API.Shard<K, V>}
 */
const isShardChild = (child) =>
  (/** @type {{children?:unknown}} */(child)).children != null


/**
 * @template K, V
 * @param {API.Shard<K, V>} self
 * @param {API.InfiniteHash} hash
 * @returns {API.Position<K, V>}
 */

export const findPlace = (self, hash) => {
  const pos = hash.take(self.options.bits)
  const child = get(self.children, pos, null)

  if (child && isShardChild(child)) {
    return findPlace(self, hash)
  } else {
    return {
      shard: self,
      entry: child,
      pos,
      hash
    }
  }
}

/**
 * @template K, V
 * @param {API.Shard<K, V>} self
 * @param {API.Position<K, V>} position
 * @param {K} key
 * @param {V} value
 * @returns {API.Shard<K, V>}
 */

export const putAt = (self, {pos, hash}, key, value) =>
  putChildAt(self, pos, { key, value, hash })

/**
 * @template K, V
 * @param {API.Shard<K, V>} self
 * @param {number} pos
 * @param {API.Child<K, V>} child
 * @returns {API.Shard<K, V>}
 */

const putChildAt = (self, pos, child) => {
  const popCount = get(self.children, pos, null) != null
    ? self.popCount
    : self.popCount + 1

    const children = set(self.children, pos, child)

    return { ...self, popCount, children }
}

/**
 * @template T
 * @param {T[]} array
 * @param {number} index
 * @param {T} value
 */
const set = (array, index, value) => {
  if (get(array, index, null) !== value) {
    const copy = array.slice()
    copy[index] = value
    return copy
  } else {
    return array
  }
}

/**
 * @template T, U
 * @param {T[]} array
 * @param {number} index
 * @param {U} notFound
 * @returns {T|U} value
 */
export const get = (array, index, notFound) =>
  index in array ? array[index] : notFound

/**
 * @template K, V
 * @param {API.Shard<K, V>} self
 * @returns {number}
 */
export const tableSize = ({options}) => Math.pow(2, options.bits)

