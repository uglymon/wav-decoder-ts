# wav-decoder-ts

[![NPM Version](https://img.shields.io/npm/v/wav-decoder-ts.svg?style=flat-square)](https://www.npmjs.org/package/wav-decoder-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> promise-based wav decoder

## Installation

```
npm install wav-decoder-ts
```

## API

- `decode(src: ArrayBuffer, [opts: object]): Promise<AudioData>`
  - if provide an instance of `Buffer`, it is converted to `ArrayBuffer` like `Uint8Array.from(src).buffer` implicitly.
  - `opts.symmetric` decode to symmetrical values
- `decode.sync(src: ArrayBuffer, [opts: object]): AudioData`
  - synchronous version

##### Returns

```js
interface AudioData {
  sampleRate: number;
  channelData: Float32Array[];
}
```

## Usage

```js
const fs = require("fs");
const WavDecoder = require("wav-decoder");

const readFile = (filepath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, (err, buffer) => {
      if (err) {
        return reject(err);
      }
      return resolve(buffer);
    });
  });
};

readFile("foobar.wav").then((buffer) => {
  return WavDecoder.decode(buffer);
}).then(function(audioData) {
  console.log(audioData.sampleRate);
  console.log(audioData.channelData[0]); // Float32Array
  console.log(audioData.channelData[1]); // Float32Array
});
```

## License

MIT
