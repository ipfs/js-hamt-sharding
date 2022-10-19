import { assert } from "aegir/utils/chai.js"
import * as Bits from "../src/bits.js"

describe("bits", () => {
  const empty = new Uint8Array()
  it("can read 0 bits", () => {
    assert.equal(Bits.readBits(empty, 0, 0), 0)
    assert.equal(Bits.readBits(empty, 10, 0), 0)
  })

  it("can read as many bits", () => {
    assert.equal(Bits.readBits(empty, 0, 100), 0)
    assert.equal(Bits.readBits(empty, 10, 1000), 0)
  })

  const zero = Uint8Array.from([0])

  it("can read nothing from [0]", () => {
    assert.equal(Bits.readBits(zero, 0, 0), 0)
  })

  it("can read bunch from [0]", () => {
    assert.equal(Bits.readBits(zero, 0, 100), 0)
    assert.equal(Bits.readBits(zero, 100, 1000), 0)
  })

  const ones = Uint8Array.from([0b11111111])

  it("can read none from [0b11111111]", () => {
    assert.equal(Bits.readBits(ones, 0, 0), 0)
  })

  for (let i = 0; i < 8; i++) {
    it(`can read bit at ${i} offset from [0b11111111]`, () => {
      assert.equal(Bits.readBits(ones, i, 1), 1)
    })
  }

  it("shound not be able to take bits after 8th bit from [0b11111111]", () => {
    assert.equal(Bits.readBits(ones, 8, 1), 0)
    assert.equal(Bits.readBits(ones, 8, 100), 0)
    assert.equal(Bits.readBits(ones, 100, 1000), 0)
  })

  const full3 = Uint8Array.from([0xff, 0xff, 0xff])
  it(`can read none from [${full3}]`, () => {
    assert.equal(Bits.readBits(full3, 0, 0), 0)
  })

  it(`can read one bit at a time from [${full3}]`, () => {
    for (let i = 0; i < 24; i++) {
      assert.equal(Bits.readBits(full3, i, 1), 1)
    }
  })

  it(`can only read first 24 bits from [${full3}]`, () => {
    assert.equal(Bits.readBits(full3, 24, 1), 0)
    assert.equal(Bits.readBits(full3, 24, 100), 0)
    assert.equal(Bits.readBits(full3, 100, 1000), 0)
  })

  it(`can read two bits at a time from [${full3}]`, () => {
    for (let i = 0; i < 24; i += 2) {
      assert.equal(Bits.readBits(full3, i, 2), 3)
    }
  })

  it(`can read read 24 bits from [${full3}]`, () => {
    assert.equal(Bits.readBits(full3, 0, 24), 0b111111111111111111111111)
  })

  it(`can read various bits`, () => {
    const bits = Uint8Array.from([0b01100101])
    assert.equal(Bits.readBits(bits, 0, 1), 0)
    assert.equal(Bits.readBits(bits, 1, 2), 3)
    assert.equal(Bits.readBits(bits, 3, 3), 1)
    assert.equal(Bits.readBits(bits, 6, 2), 1)
  })

  it(`can read from 0b10000000`, () => {
    const bits = Uint8Array.from([0b10000000])
    assert.equal(Bits.readBits(bits, 0, 2), 2)
  })
})
