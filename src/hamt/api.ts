import type { InfiniteHash } from '../consumable-hash.js'
export type { InfiniteHash }
export interface Options<K> {
  readonly bits: number

  readonly encode: (key: K) => Uint8Array
  readonly hash: (key:Uint8Array) => InfiniteHash
}


export type Child<K, V> =
  | Entry<K, V>
  | Shard<K, V>

export interface Shard<K, V> extends HAMT<K, V> {
  readonly key: K
}

export interface HAMT<K, V> {
  readonly options: Options<K>
  readonly children: Child<K, V>[]

  // TODO: Figure out what these are
  popCount: number
}

export interface Entry<K, V> {
  readonly key: K
  readonly value: V

  hash: InfiniteHash
}




export interface Position<K, V> {
  readonly shard: Shard<K, V>
  readonly pos: number

  readonly hash: InfiniteHash

  readonly entry: Entry<K, V> | null
}
