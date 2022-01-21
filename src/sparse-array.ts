// @ts-ignore
import SparseArrayView from 'sparse-array'

export interface SparseArray<B> {
  length: number
  compactArray: () => B[]
  get: (i: number) => B
  set: (i: number, value: B) => void
  reduce: <A> (fn: (acc: A, curr: B, index: number) => A, initial: A) => B
  find: (fn: (item: B) => boolean) => B | undefined
  bitField: () => number[]
  unset: (i: number) => void
}


export const create = <T>():SparseArray<T> =>
  new SparseArrayView()
