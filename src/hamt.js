// @ts-ignore

import * as API from "./hamt/api.js"
import { wrapHash } from "../dist/src/consumable-hash.js"

export { API }

/**
 * @template K, V
 * @param {object} options
 * @param {(key:K) => Uint8Array} options.encode
 * @param {(key:Uint8Array) => Uint8Array} options.hash
 * @param {number} [options.bits]
 */
export const create = ({ hash, encode, bits = 8 }) => new HAMTView({
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

  return new HAMTView(putAt(self, place, key, value))
}

/**
 * @template K, V, T
 * @param {API.Shard<K, V>} self
 * @param {K} key
 * @param {T} notFound
 * @returns {V|T}
 */
export const get = (self, key, notFound) => {
  const child = findChild(self, key)
  return child ? child.value : notFound
}

/**
 * @template K, V, T
 * @param {API.Shard<K, V>} self
 * @param {K} key
 * @returns {API.Entry<K, V>|null}
 */
export const findChild = (self, key) => {
  const place = findPlace(self, key)
  const child = nth(place.shard.children, place.pos, null)

  if (child && isShardChild(child)) {
    // should not be possible, this._findPlace should always
    // return a location for a child, not a bucket
    return null
  }

  if (child && child.key === key) {
    return child
  } else {
    return null
  }
}


/**
 * @template K, V
 * @param {API.Shard<K, V>} self
 * @param {K} key
 * @param {API.InfiniteHash} hash
 * @returns {API.Position<K, V>}
 */
export const findNewShardAndPosition = (self, key, hash=keyToHash(self, key)) => {
  let place = findPlace(self, key, hash)

  // we have a conflict
  while (place.entry && place.entry.key !== key) {
    const shard = {
      ...self,
      parent: place.shard,
      posAtParent: place.pos
    }
    putChildAt(place.shard, place.pos, shard)

    // put the previous value
    const newPlace = findPlace(shard, place.key, place.entry.hash)
    putAt(newPlace.shard, newPlace, place.entry.key, place.entry.value)

    place = findPlace(shard, place.key, place.hash)
  }

  // no conflict, we found the place
  return place
}

/**
 * @template K, V
 * @param {API.Shard<K, V>} self
 * @param {K} key
 * @returns {API.InfiniteHash}
 */
export const keyToHash = ({options:{encode, hash}}, key) => hash(encode(key))


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
 * @param {K} key
 * @param {API.InfiniteHash} [hash]
 * @returns {API.Position<K, V>}
 */

export const findPlace = (self, key, hash=keyToHash(self, key)) => {
  const pos = hash.take(self.options.bits)
  const path = [pos]
  let child = nth(self.children, pos, null)

  while(child && isShardChild(child)) {
    const pos = hash.take(self.options.bits)
    path.push(pos)
    child = nth(self.children, pos, null)
  }

  
  return {
    shard: self,
    entry: child,
    pos,
    key,
    hash
  }
}


/**
 * @template K, V
 * @param {API.Shard<K, V>} self
 * @param {K} key
 * @param {V} value
 */
export const set = (self, key, value) => {
  const { stack, hash } = locate(self, key)
  /** @type {API.Child<K, V>} */
  let child = { key, hash, value }
  let target = self

  for (const place of stack) {
    target = {
      ...place.shard,
      children: assign(place.shard.children, place.pos, child)
    }
    child = target
  }

  return new HAMTView(target)
}

/**
 * @template K, V
 * @param {API.Shard<K, V>} self
 * @param {K} key
 * @param {API.InfiniteHash} [hash]
 */
const locate = (self, key, hash=keyToHash(self, key)) => {
  const pos = hash.take(self.options.bits)
  const stack = [{shard:self, pos}]
  let child = nth(self.children, pos, null)
  while (child && isShardChild(child)) {
    const pos = hash.take(self.options.bits)
    stack.unshift({shard:child, pos})
    child = nth(self.children, pos, null)
  }

  return {
    stack,
    hash,
    child
  }
}

/**
 * @template K, V
 * @param {API.Shard<K, V>} self
 * @param {K} key
 */
const traverse = function*(self, key) {
  const hash = keyToHash(self, key)
  const pos = hash.take(self.options.bits)
  let parent = self
  let child = null
  while (child && isShardChild(child)) {
    child = nth(parent.children, pos, null)
    yield { parent, pos, child }
  }
}

/**
 * @template K, V
 */

class Cursor {
  /**
   * @param {API.HAMT<K, V>} hamt 
   * @param {K} key 
   */
  constructor(hamt, key) {
    this.hamt = hamt
    this.key = key
    this.hash = keyToHash(hamt, key)
  }

  take() {
    return this.hash.take(this.hamt.options.bits)
  }

  /**
   * @param {V} value 
   */
  set(value) {
    const { hash, key } = this
    let offset = this.take()
    let shard = this.hamt
    const stack = [{shard, offset }]
    let child = nth(shard.children, offset, null)
    while (child && isShardChild(child)) {
      shard = child
      offset = this.take()
      stack.unshift({shard, offset})
      child = nth(shard.children, offset, null)
    }

    if (child && !isShardChild(child) && child.key !== this.key) {
      // shard = { 
      //   ...shard,
      //   //parent: shard,
      //   // offset
      //   children: assign(shard.children, offset, 
      // }
      // wrap existing child in a shard
      const newShard = {
        ...shard,
        children: 
          assign(
            assign([], this.take(), { key, value: child.value, hash }),
            this.take(),
            { key, value, hash }
          )
      }

      offset = this.take()
    }

    child = { key: this.key, value, hash: this.hash }
    for (const {shard: hamt, offset} of stack) {
      shard = new HAMTView({
        ...hamt,
        children: assign(hamt.children, offset, child)
      })
    }

    return new HAMTView(shard)
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
  const popCount = nth(self.children, pos, null) != null
    ? self.popCount
    : self.popCount + 1

    const children = assign(self.children, pos, child)

    return { ...self, popCount, children }
}

/**
 * @template T
 * @param {T[]} array
 * @param {number} index
 * @param {T} value
 */
const assign = (array, index, value) => {
  if (nth(array, index, null) !== value) {
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
export const nth = (array, index, notFound) =>
  index in array ? array[index] : notFound

/**
 * @template K, V
 * @param {API.Shard<K, V>} self
 * @returns {number}
 */
export const tableSize = ({options}) => Math.pow(2, options.bits)

/**
 * @template K, V
 */
class HAMTView {
  /**
   * @param {API.Shard<K, V>} input 
   */
  constructor(input) {
    this.options = input.options
    this.children = input.children
    this.popCount = input.popCount
    Object.assign(this, input)
  }
  /**
   * 
   * @param {K} key 
   * @param {V} value 
   */
  put(key, value) {
    return put(this, key, value)
  }

  /**
   * @param {K} key
   */
  get(key) {
    return get(this, key, undefined)
  }
}
