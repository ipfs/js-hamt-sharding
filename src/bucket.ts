import * as SparseArray from './sparse-array.js'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import type { InfiniteHash } from './consumable-hash.js'

export interface BucketChild<V> {
  key: string
  value: V
  hash: InfiniteHash
}


export interface BucketPosition<T> {
  bucket: Bucket<T>
  pos: number
  hash: InfiniteHash
  existingChild?: BucketChild<T>
}

export interface BucketOptions {
  bits: number
  hash: (value: Uint8Array | InfiniteHash) => InfiniteHash
}

export class Bucket<T> {
  _options: BucketOptions
  _popCount: number
  _parent?: Bucket<T>
  _posAtParent: number
  _children: SparseArray.SparseArray<Bucket<T> | BucketChild<T>>

  key: string | null

  constructor (options: BucketOptions, parent?: Bucket<T>, posAtParent = 0) {
    this._options = options
    this._popCount = 0
    this._parent = parent
    this._posAtParent = posAtParent
    this._children = SparseArray.create()
    this.key = null
  }

  put (key: string, value: T) {
    const place = this._findNewBucketAndPos(key)

    place.bucket._putAt(place, key, value)
  }

  get (key: string) {
    const child = this._findChild(key)

    if (child) {
      return child.value
    }
  }

  del (key: string) {
    const place = this._findPlace(key)
    const child = place.bucket._at(place.pos)

    if (child && child.key === key) {
      place.bucket._delAt(place.pos)
    }
  }

  leafCount (): number {

    const children = this._children.compactArray()

    return children.reduce((acc, child) => {
      if (child instanceof Bucket) {
        return acc + child.leafCount()
      }

      return acc + 1
    }, 0)
  }

  childrenCount () {
    return this._children.length
  }

  onlyChild () {
    return this._children.get(0)
  }

  * eachLeafSeries (): Iterable<BucketChild<T>> {
    const children = this._children.compactArray()

    for (const child of children) {
      if (child instanceof Bucket) {
        yield * child.eachLeafSeries()
      } else {
        yield child
      }
    }
  }

  serialize (map: (value: BucketChild<T>, index: number) => T, reduce: (reduced: any) => any) {
    const acc: T[] = []
    // serialize to a custom non-sparse representation
    return reduce(this._children.reduce((acc, child, index) => {
      if (child) {
        if (child instanceof Bucket) {
          acc.push(child.serialize(map, reduce))
        } else {
          acc.push(map(child, index))
        }
      }
      return acc
    }, acc))
  }

  transform <U>(map: (value: BucketChild<T>) => T[], reduce: (reduced: {bitField:number[], children: T[]}[]) => U):U {
    return transformBucket(this, map, reduce)
  }

  toJSON () {
    return this.serialize(mapNode, reduceNodes)
  }

  prettyPrint () {
    return JSON.stringify(this.toJSON(), null, '  ')
  }

  tableSize () {
    return Math.pow(2, this._options.bits)
  }

  _findChild (key: string) {
    const result = this._findPlace(key)
    const child = result.bucket._at(result.pos)

    if (child instanceof Bucket) {
      // should not be possible, this._findPlace should always
      // return a location for a child, not a bucket
      return undefined
    }

    if (child && child.key === key) {
      return child
    }
  }

  _findPlace (key: string | InfiniteHash): BucketPosition<T> {
    const hashValue = this._options.hash(typeof key === 'string' ? uint8ArrayFromString(key) : key)
    const index = hashValue.take(this._options.bits)

    const child = this._children.get(index)

    if (child instanceof Bucket) {
      return child._findPlace(hashValue)
    }

    return {
      bucket: this,
      pos: index,
      hash: hashValue,
      existingChild: child
    }
  }

  _findNewBucketAndPos (key: string | InfiniteHash): BucketPosition<T> {
    const place = this._findPlace(key)

    // TODO: This seems like a bug because key may be a hash here when
    // descended second time on linke 176
    if (place.existingChild && place.existingChild.key !== key) {
      // conflict
      const bucket = new Bucket(this._options, place.bucket, place.pos)
      place.bucket._putObjectAt(place.pos, bucket)

      // put the previous value
      const newPlace = bucket._findPlace(place.existingChild.hash)
      newPlace.bucket._putAt(newPlace, place.existingChild.key, place.existingChild.value)

      return bucket._findNewBucketAndPos(place.hash)
    }

    // no conflict, we found the place
    return place
  }

  _putAt (place: BucketPosition<T>, key: string, value: T) {
    this._putObjectAt(place.pos, {
      key: key,
      value: value,
      hash: place.hash
    })
  }

  _putObjectAt (pos: number, object: Bucket<T> | BucketChild<T>) {
    if (!this._children.get(pos)) {
      this._popCount++
    }
    this._children.set(pos, object)
  }

  _delAt (pos: number) {
    if (pos === -1) {
      throw new Error('Invalid position')
    }

    if (this._children.get(pos)) {
      this._popCount--
    }
    this._children.unset(pos)
    this._level()
  }

  _level () {
    if (this._parent && this._popCount <= 1) {
      if (this._popCount === 1) {
        // remove myself from parent, replacing me with my only child
        const onlyChild = this._children.find(exists)

        if (onlyChild && !(onlyChild instanceof Bucket)) {
          const hash = onlyChild.hash
          hash.untake(this._options.bits)
          const place = {
            pos: this._posAtParent,
            hash: hash,
            bucket: this._parent
          }
          this._parent._putAt(place, onlyChild.key, onlyChild.value)
        }
      } else {
        this._parent._delAt(this._posAtParent)
      }
    }
  }

  _at (index: number) {
    return this._children.get(index)
  }
}

function exists (o: any) {
  return Boolean(o)
}

function mapNode (node: any, _: number) {
  return node.key
}

function reduceNodes (nodes: any) {
  return nodes
}

function transformBucket<T, U> (
  bucket: Bucket<T>,
  map: (value: BucketChild<T>) => T[],
  reduce: (reduced: {bitField:number[], children: T[]}[]) => U):U {
  const output = []

  for (const child of bucket._children.compactArray()) {
    if (child instanceof Bucket) {
      transformBucket(child, map, reduce)
    } else {
      const mappedChildren = map(child)

      output.push({
        bitField: bucket._children.bitField(),
        children: mappedChildren
      })
    }
  }

  return reduce(output)
}
