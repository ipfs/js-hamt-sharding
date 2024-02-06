# hamt-sharding <!-- omit in toc -->

[![codecov](https://img.shields.io/codecov/c/github/ipfs-shipyard/js-hamt-sharding.svg?style=flat-square)](https://codecov.io/gh/ipfs-shipyard/js-hamt-sharding)
[![CI](https://img.shields.io/github/actions/workflow/status/ipfs-shipyard/js-hamt-sharding/js-test-and-release.yml?branch=main\&style=flat-square)](https://github.com/ipfs/js-hamt-sharding/actions/workflows/js-test-and-release.yml?query=branch%3Amain)

> JavaScript implementation of sharding using hash array mapped tries

# About

A [Hash Mapped Trie](https://en.wikipedia.org/wiki/Hash_array_mapped_trie) implementation for JavaScript.

This is used by [@helia/unixfs](https://www.npmjs.com/package/@helia/unixfs) for it's HAMT-sharded directory implementation.

## Example

```TypeScript
import { createHAMT } from 'hamt-sharding'
import crypto from 'crypto-promise'

// decide how to hash buffers made from keys, can return a Promise
const hashFn = async (buf) => {
  return crypto
    .createHash('sha256')
    .update(buf)
    .digest()
}

const bucket = createHAMT({
  hashFn: hashFn
})

await bucket.put('key', 'value')

const output = await bucket.get('key')
// output === 'value'
```

# Install

```console
$ npm i hamt-sharding
```

## Browser `<script>` tag

Loading this module through a script tag will make it's exports available as `HamtSharding` in the global namespace.

```html
<script src="https://unpkg.com/hamt-sharding/dist/index.min.js"></script>
```

# API Docs

- <https://ipfs-shipyard.github.io/js-hamt-sharding>

# License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

# Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
