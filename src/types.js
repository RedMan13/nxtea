/** @enum */
const DataspaceEntryType = {
    0: 'void',
    1: 'ubyte',
    2: 'sbyte',
    3: 'uword',
    4: 'sword',
    5: 'ulong',
    6: 'slong',
    7: 'array',
    8: 'cluster',
    9: 'mutex',
    'void': 0,
    'ubyte': 1,
    'sbyte': 2,
    'uword': 3,
    'sword': 4,
    'ulong': 5,
    'slong': 6,
    'array': 7,
    'cluster': 8,
    'mutex': 9
}
/** @enum */
const DataspaceTypeLength = {
    0: 0,
    1: 1,
    2: 1,
    3: 2,
    4: 2,
    5: 4,
    6: 4,
    7: 2,
    8: 0,
    9: 4,
    'void': 0,
    'ubyte': 1,
    'sbyte': 1,
    'uword': 2,
    'sword': 2,
    'ulong': 4,
    'slong': 4,
    'array': 2,
    'cluster': 0,
    'mutex': 4
}

class Number {
    static cast(value) { return value; }
    static bytes(value) {
        return [
            value & 0x000000FF,
            (value & 0x0000FF00) >> 8,
            (value & 0x00FF0000) >> 16,
            (value & 0xFF000000) >> 24,
        ];
    }
    size = DataspaceTypeLength.slong;
    type = DataspaceEntryType.slong;
    flags = 0;
    // 0xFFFF is not-an-offset, meaning this will get ignoredby default
    address = 0xFFFF;
    _val = 0;
    constructor(address, flags) { this.flags = flags; this.address = address; }
    get value() { return this._val; }
    set value(value) { this._val = Object.getPrototypeOf(this).constructor.cast(value); }

    cast(value) { return Object.getPrototypeOf(this).constructor.cast(value); }
    bytes() { return Object.getPrototypeOf(this).constructor.bytes(this._val); }
    fromBin(bin, offset) {
        this._val = bin.readInt32BE(offset);
        return offset +4
    }
    toString() { return String(this._val); }
}

class Int8 extends Number {
    static cast(value) {
        // if only the last bit is set, convert to a true negative
        if (value & 0x80 && value >= 0)
            return (0xFFFFFF00 | (value & 0xFF)) || 0;
        // else, ignore the last bit and apply the js sign
        return ((value & 0x7F) * Math.sign(value)) || 0;
    }
    static bytes(value) {
        if (Math.sign(value) < 0) value |= 0x80;
        return [value & 0xFF];
    }
    size = DataspaceTypeLength.sbyte;
    type = DataspaceEntryType.sbyte;
    fromBin(bin, offset) {
        this._val = bin.readInt8(offset);
        return offset +1;
    }
}
class UInt8 extends Number {
    static cast(value) {
        // if we get passed a negative, drop the last bit and output raw
        if (value < 0) return (value & 0x7F) || 0;
        // else, just make sure its within 0-255
        return (value & 0xFF) || 0;
    }
    static bytes(value) { return [value & 0xFF]; }
    size = DataspaceTypeLength.ubyte;
    type = DataspaceEntryType.ubyte;
    fromBin(bin, offset) {
        this._val = bin.readUInt8(offset);
        return offset +1;
    }
}
class Int16 extends Number {
    static cast(value) {
        // the NXT C env seems to treat Int16 as ones-compliment, rather than twos-compliment (int8)
        // so, instead of what we did previously, just impose the bytes into a negative 32bit int
        if (value > 0x7FFF)
            return (0xFFFF0000 | (value & 0xFFFF)) || 0;
        // else, ignore the last bit and apply the js sign
        return ((value & 0x7FFF) * Math.sign(value)) || 0;
    }
    static bytes(value) {
        if (Math.sign(value) < 0) value |= 0x8000;
        return [value & 0x00FF, (value & 0xFF00) >> 8];
    }
    size = DataspaceTypeLength.sword;
    type = DataspaceEntryType.sword;
    fromBin(bin, offset) {
        this._val = bin.readInt16LE(offset);
        return offset +2;
    }
}
class UInt16 extends Number {
    static cast(value) {
        // if we get passed a negative, drop the last bit and output raw
        if (value < 0) return (value & 0x7FFF) || 0;
        // else, just make sure its within 0-25536
        return (value & 0xFFFF) || 0;
    }
    static bytes(value) { return [value & 0x00FF, (value & 0xFF00) >> 8]; }
    size = DataspaceTypeLength.uword;
    type = DataspaceEntryType.uword;
    fromBin(bin, offset) {
        this._val = bin.readUInt16LE(offset);
        return offset +2;
    }
}
class Int32 extends Number {
    static cast(value) { return (value & 0xFFFFFFFF) || 0; }
    static bytes(value) {
        return [
            value & 0x000000FF, 
            (value & 0x0000FF00) >> 8, 
            (value & 0x00FF0000) >> 16, 
            (value & 0xFF000000) >> 24
        ];
    }
    size = DataspaceTypeLength.slong;
    type = DataspaceEntryType.slong;
    fromBin(bin, offset) {
        this._val = bin.readInt32LE(offset);
        return offset +4;
    }
}
class UInt32 extends Number {
    static cast(value) {
        // js never treats integer ops as unsigned, last bit is strictly sign
        // and so wont produce 0-4294967296 range if we just do value & 0xFFFFFFFF
        return (((value % 0xFFFFFFFF) + 0xFFFFFFFF) % 0xFFFFFFFF) || 0;
    }
    static bytes(value) {
        return [
            value & 0x000000FF, 
            (value & 0x0000FF00) >> 8, 
            (value & 0x00FF0000) >> 16, 
            ((value & 0x7F000000) >> 24) + (value >= 0x80000000 ? 0x80 : 0)
        ];
    }
    size = DataspaceTypeLength.ulong;
    type = DataspaceEntryType.ulong;
    fromBin(bin, offset) {
        this._val = bin.readUInt32LE(offset);
        return offset +4;
    }
}
class DataArray {
    static cast(value) {
        if (!Array.isArray(value))
            throw new TypeError(`Attempted to cast a value of type ${typeof value} to an array`);
        return value;
    }
    static bytes(value) {
        console.warn('Static array byte casting doesnt know what byte sze to cast to!');
        return value.map(item => Number.bytes(item));
    }
    size = DataspaceTypeLength.array;
    type = DataspaceEntryType.array;
    /** @type {Number} */
    elementType = null;
    index = -1;
    _val = [];
    constructor() {}
    get value() { return this._val }
    set value(value) {
        value = DataArray.cast(value);
        this._val = value.map(item => this.elementType.cast(item));
    }

    cast(value) { return DataArray.cast(value); }
    bytes() {
        return this._val.map(value => this.elementType.bytes(value));
    }
    fromBin(bin, offset, data) {
        // static defaults provide us out index value
        if (!data) {
            this.index = bin.readInt16LE(offset);
            return offset +2;
        }
        this._val = [];
        for (let i = 0; i < data.length; i++) {
            offset = this.elementType.fromBin(bin, offset);
            this._val.push(this.elementType.value);
        }
        return offset;
    }
    get(idx) { return this._val[idx]; }
    set(idx, val) { this._val[idx] = this.elementType.cast(val); }
    push(value) {
        if (typeof value?.type === 'number')
            value = value.value;
        this._val.push(this.elementType.cast(value));
    }
    pop() { return this._val.pop(); }
    shift() { return this._val.shift(); }
    slice(start, end) { return this._val.slice(start, end); } 
    asString() {
        let str = '';
        for (let i = 0; i < this._val.length; i++) {
            if (this._val[i] === 0) break;
            str += String.fromCharCode(this._val[i]);
        }
        return str;
    }
    toString(indent = '') {
        return (this.elementType instanceof UInt8) 
            ? this.asString().split('\n').slice(0,3).join('\n')
            : `${DataspaceEntryType[this.elementType.type]}[${this._val
                .map(item => {
                    this.elementType.value = item;
                    return this.elementType.toString(indent);
                })
                .join(',')
            }]`;
    }
}
class Cluster {
    static cast(value) {
        if (!Array.isArray(value)) 
            throw new TypeError(`Attempted to cast a value of type ${typeof value} to a cluster`);
        if (value.some(item => typeof item !== 'object'))
            throw new TypeError(`Attempted to cast a value of type array to a cluster`);
        return value;
    }
    static bytes(value) {
        return value.map(item => item.bytes());
    }
    type = DataspaceEntryType.cluster;
    length = 0;
    _val = [];
    constructor(length) { this.length = length; } 
    get value() { return this._val }
    set value(value) { this._val = Cluster.cast(value); }

    cast(value) {
        const values = Cluster.cast(value);
        if (values.length !== this._val.length)
            throw new RangeError(`Cant cast clust of length ${values.length} to a cluster of length ${this._val.length}`);
        return values.map((item, i) => this._val[i].cast(item));
    }
    bytes() { return Cluster.bytes(this._val); }
    fromBin(bin, offset) {
        // we take nothing, but our children do
        for (let i = 0; i < this.length; i++) {
            const element = this._val[i];
            if (element.flags & 0b1) continue;
            offset = element.fromBin(bin, offset);
        }
        return offset;
    }
    get(idx) { return this.value[idx].value; }
    set(idx, val) { return this.value[idx].value = val; }
    toString(indent = '') {
        const base = indent;
        indent += '    ';
        return `{
${this._val.map((v) => `${indent}${v.id}: (${DataspaceEntryType[v.type]}) ${v.toString(indent)}`).join('\n')}
${base}}`;
    }
}
// do absolutely nothing rn
class Mutex {
    // default value here is just 0xFFFFFFFF, we dont actually do anything with this value
    fromBin(bin, offset) { return offset +4; }
}
// void is supposed to not do anything
class Void {
    // shim so defaults wont throw
    fromBin(bin, offset) { return offset; }
}

const TypeMap = {
    [DataspaceEntryType.void]: Void,
    [DataspaceEntryType.sbyte]: Int8,
    [DataspaceEntryType.ubyte]: UInt8,
    [DataspaceEntryType.sword]: Int16,
    [DataspaceEntryType.uword]: UInt16,
    [DataspaceEntryType.slong]: Int32,
    [DataspaceEntryType.ulong]: UInt32,
    [DataspaceEntryType.array]: DataArray,
    [DataspaceEntryType.cluster]: Cluster,
    [DataspaceEntryType.mutex]: Mutex
}

module.exports = {
    DataspaceEntryType,
    DataspaceTypeLength,
    TypeMap,
    Int8,
    Int16,
    Int32,
    UInt8,
    UInt16,
    UInt32,
    DataArray,
    Cluster
}