const { StructureError, VersionError } = require('./errors');
const { DataspaceEntryType, TypeMap, Int8, Int16 } = require('./types');

/** @enum copied straight out of c_cmd_bytecodes.h */
const Opcodes = {
//Family: Math
    ADD: 0x00, // dest, src1, src2
    SUB: 0x01, // dest, src1, src2
    NEG: 0x02, // dest, src
    MUL: 0x03, // dest, src1, src2
    DIV: 0x04, // dest, src1, src2
    MOD: 0x05, // dest, src1, src2

//Family: Logic
    AND: 0x06, // dest, src1, src2
    OR: 0x07, // dest, src1, src2
    XOR: 0x08, // dest, src1, src2
    NOT: 0x09, // dest, src

//Family: Bit manipulation
    CMNT: 0x0A, // dest, src
    LSL: 0x0B, // dest, src
    LSR: 0x0C, // dest, src
    ASL: 0x0D, // dest, src
    ASR: 0x0E, // dest, src
    ROTL: 0x0F, // dest, src
    ROTR: 0x10, // dest, src

//Family: Comparison
    CMP: 0x11, // dest, src1, src2
    TST: 0x12, // dest, src
    CMPSET: 0x13, // dest, src, testsrc, testsrc
    TSTSET: 0x14, // dest, src, testsrc

//Family: Array ops
    INDEX: 0x15, // dest, src, index
    REPLACE: 0x16, // dest, src, index, val
    ARRSIZE: 0x17, // dest, src
    ARRBUILD: 0x18, // instrsize, dest, src1, src2, �
    ARRSUBSET: 0x19, // dest, src, index, length
    ARRINIT: 0x1A, // dest, elem, length

//Family: Memory ops
    MOV: 0x1B, // dest, src
    SET: 0x1C, // dest, imm

//Family: String ops
    FLATTEN: 0x1D, // dest, src
    UNFLATTEN: 0x1E, // dest, err, src, type
    NUMTOSTRING: 0x1F, // dest, src
    STRINGTONUM: 0x20, // dest, offsetpast, src, offset, default
    STRCAT: 0x21, // instrsize, dest, src1, src2, �
    STRSUBSET: 0x22, // dest, src, index, length
    STRTOBYTEARR: 0x23, // dest, src
    BYTEARRTOSTR: 0x24, // dest, src

//Family: Control flow
    JMP: 0x25, // offset
    BRCMP: 0x26, // offset, src1, src2
    BRTST: 0x27, // offset, src
    SYSCALL: 0x28, // func, args
    STOP: 0x29, // stop?

//Family: Clump scheduling
    FINCLUMP: 0x2A, // start, end
    FINCLUMPIMMED: 0x2B, // clumpID
    ACQUIRE: 0x2C, // mutexID
    RELEASE: 0x2D, // mutexID
    SUBCALL: 0x2E, // subroutine, callerID
    SUBRET: 0x2F, // callerID

//Family: IO ops
    SETIN: 0x30, // src, port, propid
    SETOUT: 0x31, // src, port, propid
    GETIN: 0x32, // dest, port, propid
    GETOUT: 0x33, // dest, port, propid

//Family: Timing
    WAIT: 0x34, // milliseconds
    GETTICK: 0x35, // dest
    // mirror form
    0: 'ADD',
    1: 'SUB',
    2: 'NEG',
    3: 'MUL',
    4: 'DIV',
    5: 'MOD',
    6: 'AND',
    7: 'OR',
    8: 'XOR',
    9: 'NOT',
    10: 'CMNT',
    11: 'LSL',
    12: 'LSR',
    13: 'ASL',
    14: 'ASR',
    15: 'ROTL',
    16: 'ROTR',
    17: 'CMP',
    18: 'TST',
    19: 'CMPSET',
    20: 'TSTSET',
    21: 'INDEX',
    22: 'REPLACE',
    23: 'ARRSIZE',
    24: 'ARRBUILD',
    25: 'ARRSUBSET',
    26: 'ARRINIT',
    27: 'MOV',
    28: 'SET',
    29: 'FLATTEN',
    30: 'UNFLATTEN',
    31: 'NUMTOSTRING',
    32: 'STRINGTONUM',
    33: 'STRCAT',
    34: 'STRSUBSET',
    35: 'STRTOBYTEARR',
    36: 'BYTEARRTOSTR',
    37: 'JMP',
    38: 'BRCMP',
    39: 'BRTST',
    40: 'SYSCALL',
    41: 'STOP',
    42: 'FINCLUMP',
    43: 'FINCLUMPIMMED',
    44: 'ACQUIRE',
    45: 'RELEASE',
    46: 'SUBCALL',
    47: 'SUBRET',
    48: 'SETIN',
    49: 'SETOUT',
    50: 'GETIN',
    51: 'GETOUT',
    52: 'WAIT',
    53: 'GETTICK'
};
const shortOpcodes = {
    0: Opcodes.MOV,
    1: Opcodes.ACQUIRE,
    2: Opcodes.RELEASE,
    3: Opcodes.SUBCALL
}
/** @enum */
const CompareOpcodes = {
    LT: 0x00,
    GT: 0x01,
    LTEQ: 0x02,
    GTEQ: 0x03,
    EQ: 0x04,
    NEQ: 0x05,
    
    0: 'LT',
    1: 'GT',
    2: 'LTEQ',
    3: 'GTEQ',
    4: 'EQ',
    5: 'NEQ'
}
/** @enum */
const SystemCalls = {
    FileOpenRead: 0,
    FileOpenWrite: 1,
    FileOpenAppend: 2,
    FileRead: 3,
    FileWrite: 4,
    FileClose: 5,
    FileResolveHandle: 6,
    FileRename: 7,
    FileDelete: 8,
    SoundPlayFile: 9,
    SoundPlayTone: 10,
    SoundGetState: 11,
    SoundSetState: 12,
    DrawText: 13,
    DrawPoint: 14,
    DrawLine: 15,
    DrawCircle: 16,
    DrawRect: 17,
    DrawPicture: 18,
    SetScreenMode: 19,
    ReadButton: 20,
    CommLSWrite: 21,
    CommLSRead: 22,
    CommLSCheckStatus: 23,
    RandomNumber: 24,
    GetStartTick: 25,
    MessageWrite: 26,
    MessageRead: 27,
    CommBTCheckStatus: 28,
    CommBTWrite: 29,
    CommBTRead: 30,
    KeepAlive: 31,
    IOMapRead: 32,
    IOMapWrite: 33,
    0: 'FileOpenRead',
    1: 'FileOpenWrite',
    2: 'FileOpenAppend',
    3: 'FileRead',
    4: 'FileWrite',
    5: 'FileClose',
    6: 'FileResolveHandle',
    7: 'FileRename',
    8: 'FileDelete',
    9: 'SoundPlayFile',
    10: 'SoundPlayTone',
    11: 'SoundGetState',
    12: 'SoundSetState',
    13: 'DrawText',
    14: 'DrawPoint',
    15: 'DrawLine',
    16: 'DrawCircle',
    17: 'DrawRect',
    18: 'DrawPicture',
    19: 'SetScreenMode',
    20: 'ReadButton',
    21: 'CommLSWrite',
    22: 'CommLSRead',
    23: 'CommLSCheckStatus',
    24: 'RandomNumber',
    25: 'GetStartTick',
    26: 'MessageWrite',
    27: 'MessageRead',
    28: 'CommBTCheckStatus',
    29: 'CommBTWrite',
    30: 'CommBTRead',
    31: 'KeepAlive',
    32: 'IOMapRead',
    33: 'IOMapWrite'
}
class VirtualMachine {
    static version = 1.03;
    static poolAloc = 32768;
    static dataspaceTokenSize = 4;
    static clumpRecordSize = 4;
    static dopeVectorSize = 10;
    static nullClumpId = 0xFF;
    static CompareOpcodes = CompareOpcodes;
    static Opcodes = Opcodes;
    static SystemCalls = SystemCalls;

    dvaAddress = 0;
    dataspaceTable = [];
    dataspaceUsed = 0;
    clumps = [];
    codespace = Buffer.alloc(0);
    codewordCache = {};
    runQueue = [];
    name = 'Bad Name';
    syscalls = {};
    start = Date.now();

    constructor() { this.start = Date.now(); }
    /**
     * Parse header data out of a buffer
     * @param {Buffer} bin The file data to parse headers from
     */
    parse(bin) {
        if (bin.subarray(0,13).toString('ascii') !== 'MindstormsNXT')
            throw new TypeError('File is not an nxt executable');
        const version = bin.readUInt8(14) + (bin.readUInt8(15) / 100);
        if (version > VirtualMachine.version) 
            throw new VersionError('File version is to new for the VM');
        let cursor = 14;
        const metaDat = {
            dataspaceCount: bin.readUInt16LE(cursor += 2),
            dataspaceSize: bin.readUInt16LE(cursor += 2),
            dataspaceStaticSize: bin.readUInt16LE(cursor += 2),
            dataspaceDefaultsSize: bin.readUInt16LE(cursor += 2),
            dynamicDefaults: bin.readUInt16LE(cursor += 2),
            dynamicDefaultsSize: bin.readUInt16LE(cursor += 2),
            reserveStart: bin.readUInt16LE(cursor += 2),
            reserveEnd: bin.readUInt16LE(cursor += 2),
            dopeVectorOffset: bin.readUInt16LE(cursor += 2),
            fileClumpCount: bin.readUInt16LE(cursor += 2),
            codespaceCount: bin.readUInt16LE(cursor += 2),
        };
        this.dvaAddress = metaDat.dopeVectorOffset;
        if (metaDat.fileClumpCount > 0xFF)
            throw new StructureError('File contains more then 256 clumps');

        cursor += 2; // realine to the actual end of the read
        cursor += cursor % 2;
        const parents = []
        for (let i = 0; i < metaDat.dataspaceCount; i++) {
            const type = bin.readUInt8((i * VirtualMachine.dataspaceTokenSize) +0 + cursor);
            const flags = bin.readUInt8((i * VirtualMachine.dataspaceTokenSize) +1 + cursor);
            const descriptor = bin.readInt16LE((i * VirtualMachine.dataspaceTokenSize) +2 + cursor);
            const value = new TypeMap[type](descriptor, flags);
            value.id = i;
            if (parents.length) {
                const parent = parents.at(-1);
                value.isChild = true;
                switch (parent.type) {
                case DataspaceEntryType.array:
                    parent.elementType = value;
                    parents.pop();
                    break;
                case DataspaceEntryType.cluster:
                    if ((parent.value.length +1) >= parent.length) parents.pop();
                    parent.value.push(value);
                    break;
                }
            }
            if (this.isComposite(value)) parents.push(value);
            // for now, push these values out to dataspace table
            this.dataspaceTable.push(value);
        }
        this.dataspaceUsed = metaDat.dataspaceCount;
        if (parents.length)
            throw new StructureError('Dataspace Table of Content has incomplete entries');
        cursor += metaDat.dataspaceCount * VirtualMachine.dataspaceTokenSize;

        cursor += cursor % 2;
        let offset = cursor;
        cursor += metaDat.dataspaceDefaultsSize;
        for (let i = 0; i < metaDat.dataspaceCount; i++) {
            const variable = this.dataspaceTable[i];
            // skip children, parent must handle their contents
            if (variable.isChild) continue;
            // funny little zero out this value flag
            if (variable.flags & 0b1)
                // value is already zero silly!! just dont do anything
                continue;
            offset = variable.fromBin(bin, offset);
        }
        // dynamic data is kinda a pain ngl
        // we have to parse it out as the raw memory state from the nxt
        // we start, here, with the dva, cause its the easiest to do
        let dvaOffset = offset + (metaDat.dopeVectorOffset - metaDat.dataspaceStaticSize);
        const dvaMeta = {
            offset: bin.readUInt16LE(dvaOffset),
            elemSize: bin.readUInt16LE(dvaOffset +2),
            length: bin.readUInt16LE(dvaOffset +4),
            back: bin.readUInt16LE(dvaOffset +6),
            link: bin.readUInt16LE(dvaOffset +8),
        };
        const dvList = [dvaMeta];
        dvaOffset += 10;
        for (let i = 1; i < dvaMeta.length; i++) {
            const dvData = {
                offset: bin.readUInt16LE(dvaOffset),
                elemSize: bin.readUInt16LE(dvaOffset +2),
                length: bin.readUInt16LE(dvaOffset +4),
                back: bin.readUInt16LE(dvaOffset +6),
                link: bin.readUInt16LE(dvaOffset +8),
            };
            // 0xFFFF is not-an-offset and so should be ignored
            if (dvData.offset !== 0xFFFF) {
                const defaults = offset + (dvData.offset - metaDat.dataspaceStaticSize);
                for (let j = 0; j < metaDat.dataspaceCount; j++) {
                    const variable = this.dataspaceTable[j];
                    if (variable.index === i)
                        variable.fromBin(bin, defaults, dvData);
                }
            }
            dvList.push(dvData);
            dvaOffset += 10;
        }
        // for now, not going to try loading any dynamic defaults that arnt arrays
        // but, the specification does say it is entirely valid to put none-array
        // data inside the dynamic default data

        cursor += cursor % 2;
        // nxt stores clumps in the main data pool
        // i cant be assed to figured out how on earth to even emulate that though
        for (let i = 0; i < metaDat.fileClumpCount; i++) {
            this.clumps.push({
                id: i,
                fireAt: bin.readUInt8(cursor),
                dependants: bin.readUInt8(cursor +1),
                codeStart: bin.readUInt16LE(cursor +2) * 2,
                codeEnd: 0,
                cursor: 0,
                priority: 1000,
                fireCount: bin.readUInt8(cursor),
                waitingTill: NaN,
                waitingClump: null
            });
            cursor += VirtualMachine.clumpRecordSize;
        }
        // read out the depedants arrays into each clump
        for (let clumpId = 0; clumpId < this.clumps.length; clumpId++) {
            const clump = this.clumps[clumpId];
            const length = clump.dependants;
            clump.dependants = [...bin.subarray(cursor, cursor + length)];
            cursor += length;
            // since we are already here, add in codeEnd values based on the codeStart of the next clump
            clump.codeEnd = this.clumps[clumpId +1]?.codeStart ?? ((metaDat.codespaceCount -1) * 2);
            // add this clump to the queue if its ready
            if (clump.fireCount <= 0) this.runQueue.push(clumpId);
        }

        this.codespace = bin.subarray(cursor);
        let endAddress = 0;
        while (endAddress < this.codespace.length) {
            const word = this.decodeCodeword(endAddress);
            endAddress = word.endedAt;
        }
    }
    /**
     * Load a file into this VM
     * @param {Buffer} bin The file data to load
     * @param {string} name The name of the file loaded
     */
    load(bin, name = 'No Name') {
        if (!bin) throw new TypeError('load requires an actual binary file');
        this.name = name;
        this.parse(bin);
    }
    decodeCodeword(address) {
        const start = address;
        if (!(start in this.codewordCache)) {
            const pack = this.codespace.readUInt16LE(address); address += 2;
            const flags = (pack & 0x0F00) >> 8;
            let size = (pack & 0xF000) >> 12;
            if (size === 0x0E) {
                size = this.codespace.readUInt16LE(address); address += 2;
                // remove the size of the size byte, so we dont over-run cursor 
                size -= 2;
            }
            let opcode = pack & 0x00FF;
            const cmpOpcode = (pack & 0x0700) >> 8;
            const args = [];
            // short opcode flag
            if (flags & 0b1000) {
                opcode = shortOpcodes[flags & 0b0111];
                if (!opcode) debugger;
                const arg1 = Int8.cast(pack);
                args.push(arg1);
                if (size > 2) {
                    const arg2 = this.codespace.readInt16LE(address); address += 2;
                    // fixy thingy bcause 
                    args[0] = Int8.cast(arg1 + arg2);
                    args.push(arg2);
                }
            } else {
                for (let j = 2; j < size; j += 2, address += 2)
                    args.push(this.codespace.readInt16LE(address));
            }
            if (!args.length)
                throw new StructureError('Instructions can not have no arguments');
            this.codewordCache[start] = {
                opcode,
                cmpOpcode,
                args,
                endedAt: address,
                length: address - start
            }
        }
        return this.codewordCache[start];
    }
    /** Step the interpreter by one instruction */
    step() {
        for (let i = 0; i < this.runQueue.length; i++) {
            const clumpId = this.runQueue[i];
            if (!this.clumps[clumpId]) 
                throw new RangeError(`Clump id ${clumpId} does not exist`);
            const clump = this.clumps[clumpId];
            for (let j = 0; j < clump.priority; j++) {
                if (!isNaN(clump.waitingTill) && Date.now() < clump.waitingTill) continue;
                clump.waitingTill = NaN;
                const cursor = clump.codeStart + clump.cursor;
                const codeword = this.decodeCodeword(cursor);
                let keep = this.execute(clump, codeword);
                if ((clump.cursor + clump.codeStart) === cursor) clump.cursor += codeword.length;
                if ((clump.codeStart + clump.cursor) >= clump.codeEnd) {
                    keep = false;
                    // reset cursor nomatter what, as we are at the end of the clump
                    clump.cursor = 0;
                }
                if (!keep) {
                    // dequeue any instructions that resulted in a completion
                    this.runQueue.splice(i, 1);
                    i--;
                    break;
                }
            }
        }
    }
    isComposite(meta) {
        return meta && (meta.type === DataspaceEntryType.array || meta.type === DataspaceEntryType.cluster);
    }
    handlePolyOp(opcode, cmpOpcode, args) {
        const meta1 = this.dataspaceTable[args[0]];
        if (!meta1) return;
        const meta2 = this.dataspaceTable[args[1]];
        const meta3 = this.dataspaceTable[args[2]];
        if (meta1.type === DataspaceEntryType.cluster) {
            for (let i = 0; i < meta1.value.length; i++)
                this.handlePolyOp(opcode, cmpOpcode, [
                    meta1.get(i), 
                    meta2.get?.(i) ?? meta2, 
                    meta3?.get?.(i) ?? meta3
                ]);
            return;
        }
        // arrays will be a pain, cause 2d, 3d, and larger arrays exist, and all values are stored without there type wrappers ds pointers
        // since this function will handle left and/or right being scalars, we have this function
        // do poly op for scalar only inputs
        const processArray = (left, right) => {
            if (!Array.isArray(left) && (!right || !Array.isArray(right))) {
                const out = this.executeBoiler(opcode, cmpOpcode, [left,right]);
                return out;
            }
            const length = Math.min(left.length, right?.length ?? Infinity);
            const out = [];
            for (let i = 0; i < length; i++)
                out.push(processArray(left[i] ?? left, right?.[i] ?? right));
            return out;
        }
        meta1.value = processArray(meta2.value, meta3?.value);
    }
    executeBoiler(opcode, cmpOpcode, args) {
        switch (opcode) {
        case Opcodes.ADD:
            return args[0] + args[1];
        case Opcodes.SUB:
            return args[0] - args[1];
        case Opcodes.NEG:
            return -args[0];
        case Opcodes.MUL:
            return args[0] * args[1];
        case Opcodes.DIV:
            if (args[1] === 0) return 0;
            return args[0] / args[1];
        case Opcodes.MOD:
            if (args[1] === 0) return args[0];
            return args[0] % args[1];
        case Opcodes.AND:
            return args[0] & args[1];
        case Opcodes.OR:
            return args[0] | args[1];
        case Opcodes.XOR:
            return args[0] ^ args[1];
        case Opcodes.NOT:
            return !args[0];
        case Opcodes.TST:
            args[1] = 0;
        case Opcodes.CMP:
            switch (cmpOpcode) {
            case CompareOpcodes.EQ: return args[0] === args[1];
            case CompareOpcodes.NEQ: return args[0] !== args[1];
            case CompareOpcodes.GT: return args[0] > args[1];
            case CompareOpcodes.LT: return args[0] < args[1];
            case CompareOpcodes.LTEQ: return args[0] <= args[1];
            case CompareOpcodes.GTEQ: return args[0] >= args[1];
            }
            break;
        case Opcodes.MOV:
            return args[0];
        }
    }
    execute(clump, { opcode, cmpOpcode, args }) {
        switch (opcode) {
        //Family: Math
        case Opcodes.ADD:
        case Opcodes.SUB:
        case Opcodes.NEG:
        case Opcodes.MUL:
        case Opcodes.DIV:
        case Opcodes.MOD:

        //Family: Logic
        case Opcodes.AND:
        case Opcodes.OR:
        case Opcodes.XOR:
        case Opcodes.NOT:

        //Family: Comparison
        case Opcodes.CMP:
        case Opcodes.TST:
            this.handlePolyOp(opcode, cmpOpcode, args);
            break;
        case Opcodes.CMPSET:
            break;
        case Opcodes.TSTSET:
            break;

        //Family: Bit manipulation
        case Opcodes.CMNT:
            break;
        case Opcodes.LSL:
            break;
        case Opcodes.LSR:
            break;
        case Opcodes.ASL:
            break;
        case Opcodes.ASR:
            break;
        case Opcodes.ROTL:
            break;
        case Opcodes.ROTR:
            break;

        //Family: Array ops
        case Opcodes.INDEX: {
            const out = this.dataspaceTable[args[0]];
            const array = this.dataspaceTable[args[1]];
            const index = this.dataspaceTable[args[2]]?.value ?? 0;
            out.value = array.get(index);
            break;
        }
        case Opcodes.REPLACE: {
            const out = this.dataspaceTable[args[0]];
            const array = this.dataspaceTable[args[1]];
            const index = this.dataspaceTable[args[2]]?.value ?? 0;
            const value = this.dataspaceTable[args[3]];
            if (out !== array)
                out.value = [...array.value];
            if (value.type !== DataspaceEntryType.array) {
                out.set(index, value.value);
                break;
            }
            for (let i = 0; i < value.value.length; i++)
                out.set(index +i, value.get(i));
            break;
        }
        case Opcodes.ARRSIZE: {
            const out = this.dataspaceTable[args[0]];
            const array = this.dataspaceTable[args[1]];
            out.value = array.value.length;
            break;
        }
        case Opcodes.ARRBUILD: {
            const out = this.dataspaceTable[args[1]];
            out.value = args.slice(1, args.length);
            break;
        }
        case Opcodes.ARRSUBSET: {
            const out = this.dataspaceTable[args[0]];
            const array = this.dataspaceTable[args[1]];
            const index = this.dataspaceTable[args[2]]?.value ?? 0;
            const length = this.dataspaceTable[args[3]]?.value ?? array.length;
            out.value = array.slice(index, index + length);
            break;
        }
        case Opcodes.ARRINIT: {
            const out = this.dataspaceTable[args[0]];
            const value = this.dataspaceTable[args[1]]?.value ?? 0;
            const length = this.dataspaceTable[args[2]]?.value ?? 0;
            out.value = [];
            for (let i = 0; i < length; i++) 
                out.set(i, value); 
            break;
        }

        //Family: Memory ops
        case Opcodes.MOV:
            this.handlePolyOp(opcode, cmpOpcode, args);
            break;
        case Opcodes.SET: {
            const out = this.dataspaceTable[args[0]];
            out.value = args[1];
            break;
        }

        //Family: String opse = I
        case Opcodes.FLATTEN: {
            const out = this.dataspaceTable[args[0]];
            const array = this.dataspaceTable[args[1]];
            out.value = array.bytes();
            break;
        }
        case Opcodes.UNFLATTEN:
            break;
        case Opcodes.NUMTOSTRING: {
            const out = this.dataspaceTable[args[0]];
            const num = this.dataspaceTable[args[1]].value;
            const str = String(num);
            out.value = [...str, '\x00'].map(char => char.charCodeAt(0));
            break;
        }
        case Opcodes.STRINGTONUM: {
            const out = this.dataspaceTable[args[0]];
            const end = this.dataspaceTable[args[1]];
            const array = this.dataspaceTable[args[2]];
            const start = this.dataspaceTable[args[3]];
            const def = this.dataspaceTable[args[4]];
            const number = Number(array
                .slice(start, end)
                .map(char => String.fromCharCode(char))
                .join(''));
            if (isNaN(number)) {
                out.value = def.value;
                break;
            }
            out.value = number;
            break;
        }
        case Opcodes.STRCAT: {
            const out = this.dataspaceTable[args[0]];
            const res = [0];
            for (let i = 1; i < args.length; i++) {
                const array = this.dataspaceTable[args[i]];
                res.splice(-1, 1, ...array.value);
            }
            if (res.at(-1) !== 0) res.push(0);
            out.value = res;
            break;
        }
        case Opcodes.STRSUBSET: {
            const out = this.dataspaceTable[args[0]];
            const array = this.dataspaceTable[args[1]];
            const index = this.dataspaceTable[args[2]]?.value ?? 0;
            const length = this.dataspaceTable[args[3]]?.value ?? array.length;
            let cut = array.slice(index, index + length);
            if (cut.at(-1) !== 0) cut.push(0);
            out.value = cut;
            break;
        }   
        case Opcodes.STRTOBYTEARR: {
            const out = this.dataspaceTable[args[0]];
            const array = this.dataspaceTable[args[1]];
            out.value = array.slice(0, -1);
            break;
        }
        case Opcodes.BYTEARRTOSTR:
            const out = this.dataspaceTable[args[0]];
            const array = this.dataspaceTable[args[1]];
            out.value = [...array.value, 0];
            break;

        //Family: Control flow
        case Opcodes.JMP:
            clump.cursor += args[0] *2;
            break;
        case Opcodes.BRCMP: {
            const tmp = this.dataspaceTable.push(new Int8(0, 0)) -1;
            // to lazy rn to split this function and replicate the actual vm behavior by doing so
            this.handlePolyOp(Opcodes.CMP, cmpOpcode, [tmp, args[1], args[2]]);
            const res = this.dataspaceTable[tmp].value;
            delete this.dataspaceTable[tmp];
            if (res) clump.cursor += args[0] *2;
            break;
        }
        case Opcodes.BRTST: {
            const tmp = this.dataspaceTable.push(new Int8(0, 0)) -1;
            // to lazy rn to split this function and replicate the actual vm behavior by doing so
            this.handlePolyOp(Opcodes.TST, cmpOpcode, [tmp, args[1]]);
            const res = this.dataspaceTable[tmp].value;
            delete this.dataspaceTable[tmp];
            if (res) clump.cursor += args[0] *2;
            break;
        }
        case Opcodes.STOP: {
            const should = this.dataspaceTable[args[0]]?.value ?? true;
            if (should) {
                clump.cursor = 0;
                return false;
            }
            break;
        }

        //Family: Clump scheduling
        case Opcodes.FINCLUMP: {
            const start = Int16.cast(args[0]);
            const end = Int16.cast(args[1]);
            clump.cursor = 0;
            if (start === -1 || end === -1) return false;
            for (let i = start; i < end; i++) {
                if (!clump.dependants[i]) break;
                this.runQueue.push(clump.dependants[i]);
            }
            return false;
        }
        case Opcodes.FINCLUMPIMMED: {
            const target = args[0];
            clump.cursor = 0;
            if (!this.clumps[target]) return false;
            this.runQueue.push(target);
            return false;
        }
        // @todo add these two
        case Opcodes.ACQUIRE:
            break;
        case Opcodes.RELEASE:
            break;
        case Opcodes.SUBCALL:
            const routine = args[0];
            const store = this.dataspaceTable[args[1]];
            if (store) store.value = clump.id;
            this.runQueue.push(routine);
            return false;
        case Opcodes.SUBRET:
            const clumpId = this.dataspaceTable[args[0]].value;
            clump.cursor = 0;
            this.runQueue.push(clumpId);
            return false;

        //Family: IO ops
        case Opcodes.SYSCALL:
            const func = this.syscalls[args[0]];
            if (!func)
                throw new Error(`System call ${SystemCalls[args[0]] ?? args[0]} is not implemented in this VM`);
            const elements = this.dataspaceTable[args[1]]?.value;
            if (func.length !== elements.length)
                throw new RangeError(`System call ${SystemCalls[args[0]]} requires ${func.length} arguments, ${elements.length} provided`);
            func.call(this, ...elements);
            break;
        // @todo add these in
        case Opcodes.SETIN:
            break;
        case Opcodes.SETOUT:
            break;
        case Opcodes.GETIN:
            break;
        case Opcodes.GETOUT:
            break;

        //Family: Timing
        case Opcodes.WAIT:
            const msLength = this.dataspaceTable[args[1]].value;
            if (msLength < 0) break;
            clump.waitingTill = msLength + Date.now();
            break;
        case Opcodes.GETTICK: {
            const out = this.dataspaceTable[args[0]];
            const ms = Date.now() - this.start;
            out.value = ms;
            break;
        }
        default:
            throw new TypeError('Unknown opcode ' + opcode);
        }
        return true;
    }
}

module.exports = VirtualMachine;