const { SystemCalls } = require('./virtual-machine');
const fs = require('fs');
const path = require('path');
const fuckYOUesmCompat = require('@audio/speaker');
const speaker = fuckYOUesmCompat.default;
/** @import { Number as Value, UInt8, UInt16, DataArray } from './types.js' */

/** @enum */
const FileStatus = {
    SUCCESS: 0x0000,
    IN_PROGRESS: 0x0001,
    REQ_PIN: 0x0002,
    NO_MORE_HANDLES: 0x8100,
    NO_SPACE: 0x8200,
    NO_MORE_FILES: 0x8300,
    EOF_EXPECTED: 0x8400,
    END_OF_FILE: 0x8500,
    NOT_LINEAR_FILE: 0x8600,
    FILE_NOT_FOUND: 0x8700,
    HANDLE_ALREADY_CLOSED: 0x8800,
    NO_LINEAR_SPACE: 0x8900,
    UNDEFINED_ERROR: 0x8A00,
    FILE_IS_BUSY: 0x8B00,
    NO_WRITE_BUFFERS: 0x8C00,
    APPEND_NOT_POSSIBLE: 0x8D00,
    FILE_IS_FULL: 0x8E00,
    FILE_EXISTS: 0x8F00,
    MODULE_NOT_FOUND: 0x9000,
    OUT_OF_BOUNDERY: 0x9100,
    ILLEGAL_FILENAME: 0x9200,
    ILLEGAL_HANDLE: 0x9300,
    BT_BUSY: 0x9400,
    BT_CONNECT_FAIL: 0x9500,
    BT_TIMEOUT: 0x9600,
    FILE_TX_TIMEOUT: 0x9700,
    FILE_TX_DST_EXISTS: 0x9800,
    FILE_TX_SRC_MISSING: 0x9900,
    FILE_TX_STREAM_ERROR: 0x9A00,
    FILE_TX_CLOSE_ERROR: 0x9B00
}
function convertNodeError(err) {
    switch (err.code) {
    case 'EBUSY':
        return FileStatus.FILE_IS_BUSY;
    case 'ERROR_OUTOFMEMORY':
    case 'ERROR_HANDLE_DISK_FULL':
    case 'ENOSPC':
    case 'EDQUOT':
        return FileStatus.NO_MORE_FILES;
    case 'EEXIST':
        return FileStatus.FILE_EXISTS;
    case 'EFBIG':
        return FileStatus.FILE_IS_FULL;
    case 'ERROR_TOO_MANY_OPEN_FILES':
    case 'EMFILE':
        return FileStatus.NO_MORE_HANDLES;
    case 'ENAMETOOLONG':
        return FileStatus.ILLEGAL_FILENAME;
    case 'ERROR_PATH_NOT_FOUND':
    case 'ERROR_FILE_NOT_FOUND':
    case 'ENOENT':
        return FileStatus.FILE_NOT_FOUND;
    case 'ERROR_NOT_ENOUGH_MEMORY':
    case 'ENOMEM':
        return FileStatus.NO_SPACE;
    default: return FileStatus.UNDEFINED_ERROR;
    }
}

let sampleRate = 8000;
let soundOut;
let audioFlags = 0;
let playbackState = 0;
const fileHandles = {};
const start = Date.now();
/** @return {{ [key: number]: (ret: UInt16, ...args: Value[]) => void }} */
module.exports = function(vm, rootDir) {
    return {
        [SystemCalls.GetStartTick](ret) { ret.value = vm.start; },
        [SystemCalls.RandomNumber](ret) { ret.value = Math.floor(Math.random() * 65536); },
        [SystemCalls.FileClose](ret, handle) {
            ret.value = FileStatus.SUCCESS;
            try {
                if (!(handle.value in fileHandles)) {
                    ret.value = FileStatus.ILLEGAL_HANDLE;
                    return;
                }
                fs.closeSync(handle.value);
            } catch (err) {
                ret.value = convertNodeError(err);
                return;
            }
        },
        [SystemCalls.FileDelete](ret, handle) {
            ret.value = FileStatus.SUCCESS;
            try {
                if (!(handle.value in fileHandles)) {
                    ret.value = FileStatus.ILLEGAL_HANDLE;
                    return;
                }
                fs.closeSync(handle.value);
                fs.rmSync(fileHandles[handle.value]);
            } catch (err) {
                ret.value = convertNodeError(err);
                return;
            }
        },
        /** @param {DataArray} filename */
        [SystemCalls.FileOpenAppend](ret, handle, filename, length) {
            ret.value = FileStatus.SUCCESS;
            try {
                filename = path.resolve(rootDir, filename.asString());
                if (!filename.startsWith(path.resolve(rootDir))) {
                    ret.value = FileStatus.ILLEGAL_FILENAME;
                    return;
                }
                const info = fs.statSync(filename);
                if (info.isDirectory()) {
                    ret.value = FileStatus.ILLEGAL_FILENAME;
                    return;
                }
                length.value = info.size;
                const handleNum = fs.openSync(filename, 'a');
                handle.value = handleNum;
                fileHandles[handleNum] = filename;
            } catch (err) {
                ret.value = convertNodeError(err);
                return;
            }
        },
        /** @param {DataArray} filename */
        [SystemCalls.FileOpenRead](ret, handle, filename, length) {
            ret.value = FileStatus.SUCCESS;
            try {
                filename = path.resolve(rootDir, filename.asString());
                if (!filename.startsWith(path.resolve(rootDir))) {
                    ret.value = FileStatus.ILLEGAL_FILENAME;
                    return;
                }
                const info = fs.statSync(filename);
                if (info.isDirectory()) {
                    ret.value = FileStatus.ILLEGAL_FILENAME;
                    return;
                }
                length.value = info.size;
                const handleNum = fs.openSync(filename, 'r');
                handle.value = handleNum;
                fileHandles[handleNum] = filename;
            } catch (err) {
                ret.value = convertNodeError(err);
                return;
            }
        },
        /** @param {DataArray} filename */
        [SystemCalls.FileOpenWrite](ret, handle, filename, length) {
            ret.value = FileStatus.SUCCESS;
            try {
                filename = path.resolve(rootDir, filename.asString());
                if (!filename.startsWith(path.resolve(rootDir))) {
                    ret.value = FileStatus.ILLEGAL_FILENAME;
                    return;
                }
                const info = fs.statSync(filename);
                if (info.isDirectory()) {
                    ret.value = FileStatus.ILLEGAL_FILENAME;
                    return;
                }
                length.value = info.size;
                const handleNum = fs.openSync(filename, 'r+');
                handle.value = handleNum;
                fileHandles[handleNum] = filename;
            } catch (err) {
                ret.value = convertNodeError(err);
                return;
            }
        },
        /** @param {DataArray} out */
        [SystemCalls.FileRead](ret, handle, out, length) {
            ret.value = FileStatus.SUCCESS;
            try {
                if (!(handle.value in fileHandles)) {
                    ret.value = FileStatus.ILLEGAL_HANDLE;
                    return;
                }
                const buffer = Buffer.alloc(length.value);
                length.value = fs.readSync(handle.value, buffer, 0, length.value);
                out.value = [...buffer];
            } catch (err) {
                ret.value = convertNodeError(err);
                return;
            }
        },
        /** @param {DataArray} data */
        [SystemCalls.FileWrite](ret, handle, data, length) {
            ret.value = FileStatus.SUCCESS;
            try {
                if (!(handle.value in fileHandles)) {
                    ret.value = FileStatus.ILLEGAL_HANDLE;
                    return;
                }
                const buffer = Buffer.from(data.value.slice(length.value));
                length.value = fs.writeSync(handle.value, buffer, 0, length.value);
            } catch (err) {
                ret.value = convertNodeError(err);
                return;
            }
        },
        [SystemCalls.KeepAlive]() {},
        [SystemCalls.IOMapRead]() {},
        [SystemCalls.IOMapWrite]() {},
        [SystemCalls.MessageRead]() {},
        [SystemCalls.MessageWrite]() {},
        [SystemCalls.CommBTCheckStatus]() {},
        [SystemCalls.CommBTRead]() {},
        [SystemCalls.CommBTWrite]() {},
        [SystemCalls.CommLSCheckStatus]() {},
        [SystemCalls.CommLSRead]() {},
        [SystemCalls.CommLSWrite]() {},
        [SystemCalls.SoundGetState](state, flags) {
            flags.value = audioFlags;
            state.value = playbackState;
        },
        [SystemCalls.SoundPlayFile](ret, filename, loop, volume) {
            filename = path.resolve(rootDir, filename.asString());
            if (!filename.startsWith(path.resolve(rootDir))) return;
            const fd = fs.openSync(filename, 'r');

            const header = Buffer.alloc(8);
            fs.readSync(fd, header, 0, 8);
            if (header[1] !== 0x00 || !(header[0] === 0x01 || header[0] === 0x06)) return fs.closeSync(fd);
            const fileRate = header.readUInt16BE(4);

            audioFlags = 1; // updating
            playbackState = 1; // playing file
            
            if (soundOut) soundOut.close();
            if (header[0] === 0x01) sampleRate = fileRate;
            function* samples() {
                audioFlags = 2;
                while (audioFlags === 2) {
                    const data = Buffer.alloc(1024);
                    const length = fs.readSync(fd, data, 0, data.length);
                    yield data.subarray(0, length).map(v => v * volume.value / 4);

                    if (loop && length < 1024) {
                        // seek back to start
                        fs.readSync(fd, Buffer.alloc(0), 0, 0, 8);
                        return;
                    }
                    if (length < 1024) {
                        audioFlags = 0; // idle
                        playbackState = 0; // idle
                        return;
                    }
                }
                fs.closeSync(soundIn);
            };
            soundOut = speaker.from(samples(), { sampleRate, channels: 1, bitDepth: 8 });
        },
        [SystemCalls.SoundPlayTone](ret, freq, duration, loop, volume) {
            audioFlags = 1; // updating
            playbackState = 2; // playing tone
            if (soundOut) soundOut.close();
            function* samples() {
                audioFlags = 2;
                do {
                    const samples = Buffer.alloc(Math.floor((duration / 1000) * sampleRate))
                        .map((_,i) => ((Math.sin((i / sampleRate) * freq * Math.PI * 2) * volume.value / 4) * 127) + 128);
                    yield samples;
                } while (loop.value && audioFlags === 2)
            }
            soundOut = speaker.from(samples(), { sampleRate, channels: 1, bitDepth: 8 });
        },
        [SystemCalls.SoundSetState](state, flags) {
            audioFlags = flags.value;
            playbackState = state.value;
        }
    }
}