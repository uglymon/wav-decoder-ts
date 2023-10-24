"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const formats = {
    0x0001: 'lpcm',
    0x0003: 'lpcm'
};
function decodeSync(buffer, opts) {
    opts = opts || {};
    if (global.Buffer && buffer instanceof global.Buffer) {
        buffer = Uint8Array.from(buffer).buffer;
    }
    const dataView = new DataView(buffer);
    const reader = createReader(dataView);
    if (reader.string(4) !== 'RIFF') {
        throw new TypeError('Invalid WAV file');
    }
    reader.uint32(); // skip file length
    if (reader.string(4) !== 'WAVE') {
        throw new TypeError('Invalid WAV file');
    }
    let format = null;
    let audioData = null;
    do {
        const chunkType = reader.string(4);
        const chunkSize = reader.uint32();
        switch (chunkType) {
            case 'fmt ':
                format = decodeFormat(reader, chunkSize);
                if (format instanceof Error) {
                    throw format;
                }
                break;
            case 'data':
                audioData = decodeData(reader, chunkSize, format, opts);
                if (audioData instanceof Error) {
                    throw audioData;
                }
                break;
            default:
                reader.skip(chunkSize);
                break;
        }
    } while (audioData === null);
    return audioData;
}
function decode(buffer, opts) {
    return new Promise(function (resolve) {
        resolve(decodeSync(buffer, opts));
    });
}
function decodeFormat(reader, chunkSize) {
    const formatId = reader.uint16();
    if (formats[formatId] === undefined) {
        return new TypeError('Unsupported format in WAV file: 0x' + formatId.toString(16));
    }
    const format = {
        formatId: formatId,
        floatingPoint: formatId === 0x0003,
        numberOfChannels: reader.uint16(),
        sampleRate: reader.uint32(),
        byteRate: reader.uint32(),
        blockSize: reader.uint16(),
        bitDepth: reader.uint16()
    };
    reader.skip(chunkSize - 16);
    return format;
}
function decodeData(reader, chunkSize, format, opts) {
    chunkSize = Math.min(chunkSize, reader.remain());
    const numberOfChannels = format.numberOfChannels;
    const length = Math.floor(chunkSize / format.blockSize / numberOfChannels);
    const sampleRate = format.sampleRate;
    const channelData = new Array(numberOfChannels);
    for (let ch = 0; ch < numberOfChannels; ch++) {
        channelData[ch] = new Float32Array(length);
    }
    const retVal = readPCM(reader, channelData, length, format, opts);
    if (retVal instanceof Error) {
        return retVal;
    }
    return {
        numberOfChannels: numberOfChannels,
        length: length,
        sampleRate: sampleRate,
        channelData: channelData
    };
}
function readPCM(reader, channelData, length, format, opts) {
    const bitDepth = format.bitDepth;
    const decoderOption = format.floatingPoint ? 'f' : opts.symmetric ? 's' : '';
    const methodName = ('pcm' + bitDepth + decoderOption);
    if (!reader[methodName]) {
        return new TypeError('Not supported bit depth: ' + format.bitDepth);
    }
    const read = reader[methodName].bind(reader);
    const numberOfChannels = format.numberOfChannels;
    for (let i = 0; i < length; i++) {
        for (let ch = 0; ch < numberOfChannels; ch++) {
            channelData[ch][i] = read();
        }
    }
    return null;
}
function createReader(dataView) {
    let pos = 0;
    return {
        remain: function () {
            return dataView.byteLength - pos;
        },
        skip: function (n = 0) {
            pos += n;
        },
        uint8: function () {
            const data = dataView.getUint8(pos);
            pos += 1;
            return data;
        },
        int16: function () {
            const data = dataView.getInt16(pos, true);
            pos += 2;
            return data;
        },
        uint16: function () {
            const data = dataView.getUint16(pos, true);
            pos += 2;
            return data;
        },
        uint32: function () {
            const data = dataView.getUint32(pos, true);
            pos += 4;
            return data;
        },
        string: function (n = 0) {
            let data = '';
            for (let i = 0; i < n; i++) {
                data += String.fromCharCode(this.uint8());
            }
            return data;
        },
        pcm8: function () {
            const data = dataView.getUint8(pos) - 128;
            pos += 1;
            return data < 0 ? data / 128 : data / 127;
        },
        pcm8s: function () {
            const data = dataView.getUint8(pos) - 127.5;
            pos += 1;
            return data / 127.5;
        },
        pcm16: function () {
            const data = dataView.getInt16(pos, true);
            pos += 2;
            return data < 0 ? data / 32768 : data / 32767;
        },
        pcm16s: function () {
            const data = dataView.getInt16(pos, true);
            pos += 2;
            return data / 32768;
        },
        pcm24: function () {
            const x0 = dataView.getUint8(pos + 0);
            const x1 = dataView.getUint8(pos + 1);
            const x2 = dataView.getUint8(pos + 2);
            const xx = (x0 + (x1 << 8) + (x2 << 16));
            const data = xx > 0x800000 ? xx - 0x1000000 : xx;
            pos += 3;
            return data < 0 ? data / 8388608 : data / 8388607;
        },
        pcm24s: function () {
            const x0 = dataView.getUint8(pos + 0);
            const x1 = dataView.getUint8(pos + 1);
            const x2 = dataView.getUint8(pos + 2);
            const xx = (x0 + (x1 << 8) + (x2 << 16));
            const data = xx > 0x800000 ? xx - 0x1000000 : xx;
            pos += 3;
            return data / 8388608;
        },
        pcm32: function () {
            const data = dataView.getInt32(pos, true);
            pos += 4;
            return data < 0 ? data / 2147483648 : data / 2147483647;
        },
        pcm32s: function () {
            const data = dataView.getInt32(pos, true);
            pos += 4;
            return data / 2147483648;
        },
        pcm32f: function () {
            const data = dataView.getFloat32(pos, true);
            pos += 4;
            return data;
        },
        pcm64f: function () {
            const data = dataView.getFloat64(pos, true);
            pos += 8;
            return data;
        }
    };
}
exports.default = {
    decode: decode,
    decodeSync: decodeSync
};
