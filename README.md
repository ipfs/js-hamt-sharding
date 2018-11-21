# hamt-sharding

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![Jenkins](https://ci.ipfs.team/buildStatus/icon?job=IPFS%20Shipyard/js-hamt-sharding/master)](https://ci.ipfs.team/job/IPFS%20Shipyard/job/js-hamt-sharding/job/master/)
[![Codecov](https://codecov.io/gh/ipfs-shipyard/js-hamt-sharding/branch/master/graph/badge.svg)](https://codecov.io/gh/ipfs/js-hamt-sharding)
[![Dependency Status](https://david-dm.org/ipfs-shipyard/js-hamt-sharding.svg?style=flat-square)](https://david-dm.org/ipfs/js-hamt-sharding)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D3.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D8.0.0-orange.svg?style=flat-square)

> JavaScript implementation of hamt for use in sharding

## Lead Maintainer

[Alex Potsides](https://github.com/achingbrain)

## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [Example](#example)
- [Contribute](#contribute)
- [License](#license)

## Install

```
> npm install hamt-sharding
```

## Usage

### Example

```javascript
const hamt = require('hamt-sharding')
const crypto = require('crypto-promise')

// decide how to hash things, can return a Promise
const hashFn = async (value) => {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest()
}

const bucket = hamt({
  hashFn: hashFn
})

await bucket.put('key', 'value')

const output = await bucket.get('key')
// output === 'value'
```

## Contribute

Feel free to join in. All welcome. Open an [issue](https://github.com/ipfs-shipyard/js-hamt-sharding/issues)!

This repository falls under the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/contributing.md)

## License

[MIT](LICENSE)
