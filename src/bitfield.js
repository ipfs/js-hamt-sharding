
/**
 * @typedef {{
 *   bytes: Uint8Array
 *   mutable: boolean
 * }} BitField
 */

class BitFieldView {
  /**
   * @param {BitField} input 
   */
  constructor(input) {
    this.bytes = input.bytes
    this.mutable = input.mutable
  }
  /**
   * @param {number} index
   * @param {boolean} value
   */
  set(index, value) {
    return value ? set(this, index) : unset(this, index)
  }

  /**
   * @param {number} index
   * @returns {boolean}
   */
  get(index) {
    return get(this, index)
  }
}

/**
 * @param {number} size
 * @returns {BitField}
 */
export const create = (size) =>
  new BitFieldView({ mutable: false, bytes: new Uint8Array(size / 8) })

/**
 * 
 * @param {Uint8Array} bytes
 * @returns {BitField}
 */
export const from = (bytes) =>
  new BitFieldView({ mutable: false, bytes: new Uint8Array(bytes) })


/**
 * SetBit sets the `n`th bit.
 * 
 * @param {BitField} self 
 * @param {number} n 
 */
export const set = (self, n) => {
  self.bytes[offset(self, n)] |= 1 << (n % 8)
  return self
}

/**
 * UnsetBit unsets the `n`th bit.
 *
 * @param {BitField} self 
 * @param {number} n 
 */
export const unset = (self, n) => {
  self.bytes[offset(self, n)] &= 0xFF ^ (1 << (n % 8))
  return self
}

/**
 * Bit returns the `n`th bit.
 * 
 * @param {BitField} self 
 * @param {number} n 
 */
export const get = (self, n) => {
  return ((self.bytes[offset(self, n)] >> (n % 8)) & 0x1 ) != 0
}

/**
 * Returns offset in the bytearray for the given bit offset.
 * 
 * @param {BitField} self 
 * @param {number} n 
 */
export const offset = (self, n) =>
  self.bytes.length - 1 - (n >> 3)

/**
 * Bit returns the `n`th bit.
 * 
 * @param {BitField} self
 */
export const ones = (self) => {
  let count = 0
  for (const b of self.bytes) {
    count += countBits(b)
  }
  return count
}

/**
 * @see https://graphics.stanford.edu/~seander/bithacks.html#:~:text=The%20best%20method%20for%20counting%20bits%20in%20a%2032%2Dbit%20integer%20v%20is%20the%20following%3A
 * @param {number} n 
 * @returns {number}
 */
export const countBits = (n) => {
  n = n - ((n >> 1) & 0x55555555)
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
  return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
}
