interface AudioData {
    sampleRate: number;
    channelData: Float32Array[];
}
interface DecodeOptions {
    symmetric?: boolean;
}
export declare function decode(buffer: ArrayBuffer, opts?: DecodeOptions): Promise<AudioData>;
export declare function decodeSync(buffer: ArrayBuffer, opts?: DecodeOptions): AudioData;