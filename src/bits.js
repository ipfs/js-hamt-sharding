/**
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @param {number} count
 */
export const readBits = (bytes, offset, count) => {
  let byteOffset = bytes.byteLength - 1 - ((offset / 8) >> 0)
  let bitOffset = 7 - (offset % 8)
  let desired = count
  let bits = 0
  while (desired > 0 && byteOffset >= 0) {
    const byte = bytes[byteOffset]
    const available = bitOffset + 1
    const taking = available < desired ? available : desired
    const value = byteBitsToInt(byte, available - taking, taking)
    bits = (bits << taking) + value

    desired -= taking
    byteOffset--
    bitOffset = 7
  }

  return bits
}

/**
 *
 * @param {number} byte
 * @param {number} bitOffset
 * @param {number} count
 */

const byteBitsToInt = (byte, bitOffset, count) =>
  (byte & mask(bitOffset, count)) >>> bitOffset

/**
 * @param {number} bitOffset
 * @param {number} count
 * @returns
 */
const mask = (bitOffset, count) => {
  const endOffset = bitOffset + count - 1
  return START_MASKS[bitOffset] & END_MASKS[endOffset < 7 ? endOffset : 7]
}

const START_MASKS = [
  0b11111111, 0b11111110, 0b11111100, 0b11111000, 0b11110000, 0b11100000,
  0b11000000, 0b10000000,
]

const END_MASKS = [
  0b00000001, 0b00000011, 0b00000111, 0b00001111, 0b00011111, 0b00111111,
  0b01111111, 0b11111111,
]
