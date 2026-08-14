const { WebUSB } = require('usb');
const path = require('path');
const EventEmitter = require('events');
const usb = new WebUSB({ allowAllDevices: true });

/**
 * @typedef {{ status: Status, command: Commands, [key: string]: any }} CommandReturn
 */
/** @enum */
const Status = {
    success: 0,
    inProgress: 1,
    requiresPincode: 2,
    pendingCommunicationTransactionInProgress: 32,
    specifiedMailboxQueueIsEmpty: 64,
    noMoreHandles: 129,
    noSpace: 130,
    noMoreFiles: 131,
    endOfFileExpected: 132,
    endOfFile: 133,
    notALinearFile: 134,
    fileNotFound: 135,
    handleAllReadyClosed: 136,
    noLinearSpace: 137,
    undefinedError: 138,
    fileIsBusy: 139,
    noWriteBuffers: 140,
    appendNotPossible: 141,
    fileIsFull: 142,
    fileExists: 143,
    moduleNotFound: 144,
    outOfBoundary: 145,
    illegalFileName: 146,
    illegalHandle: 147,
    bluetoothBusy: 148,
    bluetoothConnectionFailed: 149,
    bluetoothTimeout: 150,
    fileTransferTimeout: 151,
    fileTransferDestinationExists: 152,
    fileTransferSourceMissing: 153,
    fileTransferStreamError: 154,
    fileTransferCloseError: 155,
    requestFailed: 189,
    unknownCommandOpcode: 190,
    insanePacket: 191,
    dataContainsOutOfRangeValues: 192,
    communicationBusError: 221,
    noFreeMemoryInCommunicationBuffer: 222,
    connectionIsNotValid: 223,
    connectionNotConfiguredOrBusy: 224,
    noActiveProgram: 236,
    illegalSizeSpecified: 237,
    illegalMailboxQueueIdSpecified: 238,
    attemptedToAccessInvalidFieldOfAStructure: 239,
    badInputOrOutputSpecified: 240,
    insufficientMemoryAvailable: 251,
    badArguments: 255,
    

    0: 'success',
    32: 'pendingCommunicationTransactionInProgress',
    64: 'specifiedMailboxQueueIsEmpty',
    129: 'noMoreHandles',
    130: 'noSpace',
    131: 'noMoreFiles',
    132: 'endOfFileExpected',
    133: 'endOfFile',
    134: 'notALinearFile',
    135: 'fileNotFound',
    136: 'handleAllReadyClosed',
    137: 'noLinearSpace',
    138: 'undefinedError',
    139: 'fileIsBusy',
    140: 'noWriteBuffers',
    141: 'appendNotPossible',
    142: 'fileIsFull',
    143: 'fileExists',
    144: 'moduleNotFound',
    145: 'outOfBoundary',
    146: 'illegalFileName',
    147: 'illegalHandle',
    148: 'bluetoothBusy',
    149: 'bluetoothConnectionFailed',
    150: 'bluetoothTimeout',
    151: 'fileTransferTimeout',
    152: 'fileTransferDestinationExists',
    153: 'fileTransferSourceMissing',
    154: 'fileTransferStreamError',
    155: 'fileTransferCloseError',
    189: 'requestFailed',
    190: 'unknownCommandOpcode',
    191: 'insanePacket',
    192: 'dataContainsOutOfRangeValues',
    221: 'communicationBusError',
    222: 'noFreeMemoryInCommunicationBuffer',
    223: 'connectionIsNotValid',
    224: 'connectionNotConfiguredOrBusy',
    236: 'noActiveProgram',
    237: 'illegalSizeSpecified',
    238: 'illegalMailboxQueueIdSpecified',
    239: 'attemptedToAccessInvalidFieldOfAStructure',
    240: 'badInputOrOutputSpecified',
    251: 'insufficientMemoryAvailable',
    255: 'badArguments'
}
// last bit is should reply, for now im just going to ignore it
/** @enum */
const CommandTypes = {
    system: 1,
    control: 0,
    reply: 2,
}
/** @enum */
const Commands = {
    // remote control commands
    startProgram: 0,
    stopProgram: 1,
    playSound: 2,
    playTone: 3,
    setOutput: 4,
    setInput: 5,
    getOutput: 6,
    getInput: 7,
    clearInput: 8,
    writeMessage: 9,
    resetMotorPos: 10,
    getBattery: 11,
    stopSounds: 12,
    keepAlive: 13,
    lowspeedStatus: 14,
    lowspeedWrite: 15,
    lowspeedRead: 16,
    currentProgram: 17,
    messageRead: 19,
    // system commands
    openReadFile: 128,
    openWriteFile: 129,
    readFile: 130,
    writeFile: 131,
    closeFile: 132,
    deleteFile: 133,
    findFile: 134,
    findNextFile: 135,
    firmwareVersion: 136,
    openWriteLinearFile: 137,
    // listed, but does nothing
    openReadLinearFile: 138,
    openWriteDataFile: 139,
    openAppendDataFile: 140,
    findModule: 144,
    findNextModule: 145,
    closeModule: 146,
    readIOMap: 148,
    writeIOMap: 149,
    bootBrick: 151,
    setBrickName: 152,
    deviceInfo: 155,
    formatFlash: 160,
    pollLength: 161,
    poll: 162,
    bluetoothFactoryReset: 164,

    0: 'startProgram',
    1: 'stopProgram',
    2: 'playSound',
    3: 'playTone',
    4: 'setOutput',
    5: 'setInput',
    6: 'getOutput',
    7: 'getInput',
    8: 'clearInput',
    9: 'writeMessage',
    10: 'resetMotorPos',
    11: 'getBattery',
    12: 'stopSounds',
    13: 'keepAlive',
    14: 'lowspeedStatus',
    15: 'lowspeedWrite',
    16: 'lowspeedRead',
    17: 'currentProgram',
    19: 'messageRead',
    128: 'openReadFile',
    129: 'openWriteFile',
    130: 'readFile',
    131: 'writeFile',
    132: 'closeFile',
    133: 'deleteFile',
    134: 'findFile',
    135: 'findNextFile',
    136: 'firmwareVersion',
    137: 'openWriteLinearFile',
    138: 'openReadLinearFile',
    139: 'openWriteDataFile',
    140: 'openAppendDataFile',
    144: 'findModule',
    145: 'findNextModule',
    146: 'closeModule',
    148: 'readIOMap',
    149: 'writeIOMap',
    151: 'bootBrick',
    152: 'setBrickName',
    155: 'deviceInfo',
    160: 'formatFlash',
    161: 'pollLength',
    162: 'poll',
    164: 'bluetoothFactoryReset'
}
/** @enum */
const SensorTypes = {
    noSensor: 0,
    switch: 1,
    tempurature: 2,
    reflection: 3,
    angle: 4,
    lightActivated: 5,
    darkActivated: 6,
    soundDecibel: 7,
    soundDecibelWheighted: 8,
    custom: 9,
    lowspeed: 10,
    lowspeedPowered: 11
}
/** @enum */
const SensorModes = {
    raw: 0,
    boolean: 32,
    // dunno what that is
    transitionCNT: 64,
    periodCounter: 96,
    PCTFullScale: 128,
    celsius: 160,
    fahrenheit: 192,
    angleSteps: 224
}
/** @enum */
const PollBuffers = {
    usb: 0,
    highspeed: 1
}
/** @enum */
const InputPorts = {
    port1: 0,
    port2: 1,
    port3: 2,
    port4: 3
}
/** @enum */
const OutputPorts = {
    portA: 0,
    portB: 1,
    portC: 2,
    all: 255
}
/** @enum */
const MotorModeBits = {
    on: 1,
    brake: 2,
    regulated: 4
}
/** @enum */
const MotorRegulators = {
    none: 0,
    speed: 1,
    syncronised: 2
}
/** @enum */
const MotorState = {
    idle: 0,
    rampUp: 16,
    hold: 32,
    rampDown: 64
}
/** @enum */
const ModuleIds = {
    cmd: 1,
    output: 2,
    input: 3,
    button: 4,
    comm: 5,
    ioCtrl: 6,
    led: 7,
    sound: 8,
    loader: 9,
    display: 10,
    lowSpeed: 11,
    ui: 12
}
/**
 * Transforms a ansiiz range into a js utf8 string
 * @param {Buffer} buffer 
 * @param {number} start 
 * @param {number} end 
 * @returns {string} standard js utf8 string
 */
function asciiz(buffer, start, end) {
    let str = '';
    for (let i = start; i < end; i++) {
        if (buffer[i] === 0) break;
        str += String.fromCharCode(buffer[i]);
    }
    return str;
}
class NXTCommunication extends EventEmitter {
    static ModuleIds = ModuleIds;
    static MotorState = MotorState;
    static MotorRegulators = MotorRegulators;
    static MotorModeBits = MotorModeBits;
    static OutputPorts = OutputPorts;
    static InputPorts = InputPorts;
    static PollBuffers = PollBuffers;
    static SensorModes = SensorModes;
    static SensorTypes = SensorTypes;
    static Commands = Commands;
    static CommandTypes = CommandTypes;
    static Status = Status;
    static listDevices() {
        return usb.getDevices()
            .then(devices => devices.filter(device => device.vendorId === 0x0694 && device.productId === 0x0002));
    }
    /** @type {USBDevice} */
    device = null;
    root = process.cwd();
    /** If this comm handler should allow external devices read/write access to the local systems filesystem */
    enableFileAccess = false;
    /** @type {import('./virtual-machine')} */
    vm = null;
    ready = Promise.resolve();
    /** @type {Function?} */
    _resolveReady = null;
    
    /**
     * @param {USBDevice?} device The device to interface with, if unset it will be the first valid device
     * @param {string?} root A string that marks where all filesystem operations should be performed and constrained, defaults to the current working directory
     * @param {import('./virtual-machine')|null} vm The virtual machine, if it exists. if unset then all commands that require it will return requestFailed
     */
    constructor(device, root = process.cwd(), vm) {
        super();
        this.root = root;
        this.vm = vm;
        this.ready = new Promise(resolve => this._resolveReady = resolve);
        if (device) this._initDevice(device);
        else usb.requestDevice({ filters: [{ vendorId: 0x0694, productId: 0x0002 }] })
            .then(device => this._initDevice(device));
    }
    async _initDevice(device) {
        this.device = device;
        // ensure it is very much absolutely without a shadow of a doubt open
        this.device.open();
        this.closeWhenReady = false;
        this.openFileHandles = [];
        this.openModuleHandles = [];
        // so slow :weary:
        // but, if i dont do it this way js will kill me sooooo
        this.interval = setInterval(async () => {
            if (this.closeWhenReady) {
                // file the requests, dont expect a reply back
                for (const handle of this.openFileHandles) await this.closeFile(handle, true);
                for (const handle of this.openModuleHandles) await this.closeModule(handle, true);
                clearInterval(this.interval);
                this.device.close();
                return;
            }
            const buf = await this.device.transferIn(2, 64);
            if (buf.status === 'babble') throw new Error('NXTs response was to big to handle');
            if (buf.status === 'stall') this.device.clearHalt('in', 2);
            // we have nothing to do once we recieve the data
            this._recieve(Buffer.from(buf.data.buffer));
        }, 0);
        this.emit('ready');
        this._resolveReady?.();
    }
    close() {
        this.closeWhenReady = true;
    }
    /**
     * Handle buffer data sent from the nxt to us
     * @param {Buffer} buf 
     */
    _recieve(buf) {
        const type = buf.readUInt8(0);
        const command = buf.readUInt8(1);
        const event = {
            status: buf.readUInt8(2),
            command
        }
        // some commands will do this always, otherwise this is an error nomatter what
        if (buf.length > 3) {
            // last bit sets if we should send replies
            switch (type & 0x7F) {
            // we have no IO to control, normally
            case CommandTypes.control: break;
            case CommandTypes.system: break;
            case CommandTypes.reply: 
                switch (command) {
                case Commands.bootBrick:
                    Object.assign(event, {
                        // should probably check, although we dont need this value either
                        wasValid: buf.subarray(3, 7).toString('ascii') === 'Yes\0'
                    });
                    break;
                case Commands.closeFile:
                    Object.assign(event, {
                        handle: buf.readUInt8(3)
                    });
                    break;
                case Commands.closeModule:
                    Object.assign(event, {
                        handle: buf.readUInt8(3)
                    });
                    break;
                case Commands.currentProgram:
                    Object.assign(event, {
                        filename: asciiz(buf, 3, 23)
                    });
                    break;
                case Commands.deleteFile:
                    Object.assign(event, {
                        filename: asciiz(buf, 3, 23)
                    });
                    break;
                case Commands.deviceInfo:
                    Object.assign(event, {
                        name: asciiz(buf, 3, 18),
                        bluetoothAddress: buf.subarray(18, 25).toString('hex'),
                        channelQualities: [buf.readUInt8(25), buf.readUInt8(26), buf.readUInt8(27), buf.readUInt8(28)],
                        availableFlash: buf.readUInt32LE(29)
                    });
                    break;
                case Commands.findNextFile:
                case Commands.findFile:
                    Object.assign(event, {
                        handle: buf.readUInt8(3),
                        filename: asciiz(buf, 4, 24),
                        size: buf.readUInt32LE(24)
                    })
                    break;
                case Commands.findNextModule:
                case Commands.findModule:
                    Object.assign(event, {
                        handle: buf.readUInt8(3),
                        name: asciiz(buf, 4, 24),
                        moduleID: buf.readUInt32LE(24),
                        size: buf.readUInt32LE(28),
                        mapSize: buf.readUInt16LE(32)
                    });
                    break;
                case Commands.firmwareVersion:
                    Object.assign(event, {
                        protocolVersion: buf.readUInt16LE(3),
                        firmwareVersion: buf.readUInt16LE(5)
                    });
                    break;
                case Commands.getBattery:
                    Object.assign(event, {
                        voltage: buf.readUInt16LE(3)
                    });
                    break;
                case Commands.getInput:
                    Object.assign(event, {
                        port: buf.readUInt8(3),
                        valid: !!buf.readUInt8(4),
                        calibrated: !!buf.readUInt8(5),
                        type: buf.readUInt8(6),
                        mode: buf.readUInt8(7),
                        raw: buf.readUInt16LE(8),
                        normalized: buf.readUInt16LE(10),
                        scaled: buf.readInt16LE(12),
                        calibrated: buf.readInt16LE(14)
                    });
                    break;
                case Commands.getOutput:
                    Object.assign(event, {
                        port: buf.readUInt8(3),
                        power: buf.readInt8(4),
                        mode: buf.readInt8(5),
                        regulator: buf.readInt8(6),
                        ratio: buf.readInt8(7),
                        state: buf.readUInt8(8),
                        tachometerLimit: buf.readUInt32LE(9),
                        tachometerCount: buf.readInt32LE(13),
                        tachometerMovement: buf.readInt16LE(17),
                        rotation: buf.readInt16LE(21),
                    });
                    break;
                case Commands.keepAlive:
                    Object.assign(event, {
                        sleepLength: buf.readUInt32LE(3),
                    });
                    break;
                case Commands.lowspeedRead:
                    Object.assign(event, {
                        bytesFetched: buf.readUInt8(3),
                        bytes: buf.subarray(4, 20)
                    });
                    break;
                case Commands.lowspeedStatus:
                    Object.assign(event, {
                        maxBytes: buf.readUInt8(3)
                    });
                    break;
                case Commands.messageRead:
                    Object.assign(event, {
                        inbox: buf.readUInt8(3),
                        length: buf.readUInt8(4),
                        content: asciiz(buf, 5, 64)
                    });
                    break;
                case Commands.openAppendDataFile:
                    Object.assign(event, {
                        handle: buf.readUInt8(3),
                        maxSize: buf.readUInt32LE(4)
                    });
                    break;
                case Commands.openReadFile:
                    Object.assign(event, {
                        handle: buf.readUInt8(3),
                        size: buf.readUInt32LE(4)
                    });
                    break;
                case Commands.openReadLinearFile:
                    Object.assign(event, {
                        memoryAddress: buf.readUInt32LE(3)
                    });
                    break;
                case Commands.openWriteLinearFile:
                case Commands.openWriteFile:
                case Commands.openWriteDataFile:
                    Object.assign(event, {
                        handle: buf.readUInt8(3)
                    });
                    break;
                case Commands.poll:
                    this.emit(Commands[command], {
                        status: buf.readUInt8(3),
                        buffer: buf.readUInt8(2),
                        length: buf.readUInt8(4),
                        data: buf.subarray(5, 65)
                    });
                    break;
                case Commands.pollLength:
                    this.emit(Commands[command], {
                        status: buf.readUInt8(3),
                        buffer: buf.readUInt8(2),
                        length: buf.readUInt8(4)
                    });
                    break;
                case Commands.readFile:
                    Object.assign(event, {
                        handle: buf.readUInt8(3),
                        length: buf.readUInt16LE(4),
                        data: buf.subarray(6, 64)
                    });
                    break;
                case Commands.readIOMap:
                    Object.assign(event, {
                        moduleID: buf.readUInt32LE(3),
                        length: buf.readUInt16LE(7),
                        data: buf.subarray(9, 64)
                    });
                    break;
                case Commands.writeFile:
                    Object.assign(event, {
                        handle: buf.readUInt8(3),
                        length: buf.readUInt16LE(4)
                    });
                    break;
                case Commands.writeIOMap:
                    Object.assign(event, {
                        moduleID: buf.readUInt32LE(3),
                        length: buf.readUInt16LE(7)
                    });
                    break;
                }
                break;
            }
        }
        this.emit(Commands[command], event);
    }
    /**
     * Send a message to the NXT
     * @param {CommandTypes} type 
     * @param {Commands} command 
     * @param {{ [key: string]: any }} args 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn|null>}
     */
    send(type, command, args, noReply) {
        return new Promise(async (resolve, reject) => {
            const buffer = Buffer.alloc(64);
            buffer.writeUInt8(type | (noReply ? 0x80 : 0), 0);
            buffer.writeUInt8(command, 1);
            switch (command) {
            case Commands.bootBrick: buffer.write('Let\'s dance: SAMBA\0', 2, 'ascii'); break;
            case Commands.findNextModule:
            case Commands.findNextFile: 
            case Commands.closeModule:
            case Commands.closeFile: buffer.writeUInt8(args.handle, 2); break;
            case Commands.openWriteLinearFile:
            case Commands.openWriteFile:
            case Commands.openWriteDataFile:
                buffer.write(args.filename.slice(0, 19) + '\0', 2, 'ascii');
                buffer.writeUInt32LE(args.size, 22);
                break;
            case Commands.startProgram:
            case Commands.openReadLinearFile:
            case Commands.openReadFile:
            case Commands.openAppendDataFile:
            case Commands.deleteFile:
            case Commands.findFile: buffer.write(args.filename.slice(0, 19) + '\0', 2, 'ascii'); break;
            case Commands.findModule: buffer.write(args.moduleName.slice(0, 19) + '\0', 2, 'ascii'); break;
            case Commands.getInput:
            case Commands.getOutput:
            case Commands.lowspeedRead:
            case Commands.lowspeedStatus:
            case Commands.clearInput: buffer.writeUInt8(args.port, 2); break;
            case Commands.lowspeedWrite:
                buffer.writeUInt8(args.port, 2);
                buffer.writeUInt8(args.lengthSent, 3);
                buffer.writeUInt8(args.lengthRecieved, 4);
                args.data.subarray(0, buffer.length - 5).copy(buffer, 5);
                break;
            case Commands.messageRead:
                buffer.writeUInt8(args.remoteInbox, 2);
                buffer.writeUInt8(args.inbox, 3);
                buffer.writeUInt8(args.shouldRemove, 4);
                break;
            case Commands.playSound: 
                buffer.writeUInt8(args.loop ? 1 : 0, 2);
                buffer.write(args.filename.slice(0, 19) + '\0', 3, 'ascii');
                break;
            case Commands.playTone:
                buffer.writeUInt16LE(args.frequency, 2);
                buffer.writeUInt16LE(args.duration, 4);
                break;
            case Commands.poll:
                buffer.writeUInt8(args.buffer, 2);
                buffer.writeUInt8(args.length);
                break;
            case Commands.pollLength: buffer.writeUInt8(args.buffer, 2); break;
            case Commands.readFile:
                buffer.writeUInt8(args.handle, 2);
                buffer.writeUInt16LE(args.length, 3);
                break;
            case Commands.readIOMap:
                buffer.writeUInt32LE(args.moduleID, 2);
                buffer.writeUInt16LE(args.offset, 6);
                buffer.writeUInt16LE(args.length, 8);
                break;
            case Commands.resetMotorPos:
                buffer.writeUInt8(args.port, 2);
                buffer.writeUInt8(args.relative ? 1 : 0, 3);
                break;
            case Commands.setBrickName: buffer.write(args.name.slice(0, 15) + '\0', 2, 'ascii'); break;
            case Commands.setInput:
                buffer.writeUInt8(args.port, 2);
                buffer.writeUInt8(args.type, 3);
                buffer.writeUInt8(args.mode, 4);
                break;
            case Commands.setOutput:
                buffer.writeUInt8(args.port, 2);
                buffer.writeInt8(args.power, 3);
                buffer.writeUInt8(args.mode, 4);
                buffer.writeUInt8(args.regulator, 5);
                buffer.writeInt8(args.ratio, 6);
                buffer.writeUInt8(args.state, 7);
                buffer.writeUint32LE(args.tachometerLimit, 8);
                break;
            case Commands.writeFile:
                buffer.writeUInt8(args.handle, 2);
                args.data.copy(buffer, 3, 0, buffer.length - 3);
                break;
            case Commands.writeIOMap:
                buffer.writeUInt32LE(args.moduleID, 2);
                buffer.writeUInt16LE(args.offset, 6);
                buffer.writeUInt16LE(args.length, 8);
                args.data.copy(buffer, 10, 0, buffer.length - 10);
                break;
            case Commands.writeMessage:
                buffer.writeUInt8(args.inbox, 2);
                buffer.writeUInt8(args.length, 3);
                buffer.write(args.message.slice(0, 59) + '\0', 4);
                break;
            }
            await this.device.transferOut(1, buffer);
            if (noReply) return resolve();
            const handle = res => resolve(res);
            this.once(Commands[command], handle);
            // if we dont recieve a response in time, assume we wont ever recieve a response
            setTimeout(() => {
                this.off(Commands[command], handle);
                // the NXT doesnt actually have any error message for this, sadly
                resolve({ command, status: Status.undefinedError, timedout: true });
            }, 4000);
        });
    }
    makeError(data) {
        let error;
        if (!data) return;
        if (data.status === Status.success) return;
        if (data.timedout) 
            error = new Error(`${Commands[data.command]}: NXT Did not respond in under four seconds`);
        error = new Error(`[${Status[data.status]}]: ${Commands[data.command]}: ${JSON.stringify(data)}`);
        error.status = data.status;
        error.command = data.command;
        error.data = data;
        throw error;
    }
    // here comes the de-verbosed helper functions
    // remote control commands
    /**
     * Starts a program on the NXT
     * @param {string} filename 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn>}
     */
    async startProgram(filename, noReply) {
        const res = await this.send(CommandTypes.control, Commands.startProgram, { filename }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Stops any currently running program on the NXT
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn>}
     */
    async stopProgram(noReply) { 
        const res = await this.send(CommandTypes.control, Commands.stopProgram, {}, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Plays a sound file on the NXT
     * @param {string} filename 
     * @param {boolean?} loop 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn>}
     */
    async playSound(filename, loop = false, noReply) {
        const res = await this.send(CommandTypes.control, Commands.playSound, { filename, loop }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Plays a tone on the NXT
     * @param {number} frequency 
     * @param {number} duration 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn>}
     */
    async playTone(frequency, duration, noReply) {
        const res = await this.send(CommandTypes.control, Commands.playTone, { frequency, duration }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Sets an output port on the NXT (A-C) to a specific state
     * @param {OutputPorts} port 
     * @param {number} power 
     * @param {MotorModeBits} mode 
     * @param {MotorRegulators} regulator 
     * @param {number} ratio 
     * @param {MotorState} state 
     * @param {number} tachometerLimit 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn>}
     */
    async setOutput(port, power, mode, regulator, ratio, state, tachometerLimit, noReply) {
        const res = await this.send(CommandTypes.control, Commands.setOutput, { port, power, mode, regulator, ratio, state, tachometerLimit }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Sets the configuration for an input port (1-4) on the NXT
     * @param {InputPorts} port 
     * @param {SensorTypes} type 
     * @param {SensorModes} mode 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn>}
     */
    async setInput(port, type, mode, noReply) {
        const res = await this.send(CommandTypes.control, Commands.setInput, { port, type, mode }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Gets an output ports (A-C) state and values
     * @param {OutputPorts} port 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & {
     *     port: OutputPorts,
     *     power: number,
     *     mode: MotorModeBits,
     *     regulator: MotorRegulators,
     *     ratio: number,
     *     state: MotorState,
     *     tachometerLimit: number,
     *     tachometerCount: number,
     *     tachometerMovement: number,
     *     rotation: number,
     * }>}
     */
    async getOutput(port, noReply) {
        const res = await this.send(CommandTypes.control, Commands.getOutput, { port }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Gets an input ports (1-4) configuration and values
     * @param {InputPorts} port 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & {
     *     port: InputPorts,
     *     valid: boolean,
     *     calibrated: boolean,
     *     type: SensorTypes,
     *     mode: SensorModes,
     *     raw: number,
     *     normalized: number,
     *     scaled: number,
     *     calibrated: number
     * }>}
     */
    async getInput(port, noReply) {
        const res = await this.send(CommandTypes.control, Commands.getInput, { port }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Clears the values and state of an input
     * @param {InputPorts} port 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn>}
     */
    async clearInput(port, noReply) {
        const res = await this.send(CommandTypes.control, Commands.clearInput, { port }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Writes a message into the NXTs mailbox
     * @param {number} inbox 
     * @param {number} length 
     * @param {string} message 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn>}
     */
    async writeMessage(inbox, length, message, noReply) {
        const res = await this.send(CommandTypes.control, Commands.writeMessage, { inbox, length, message }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Resets the position of a motor on the NXT
     * @param {OutputPorts} port 
     * @param {boolean} relative 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn>}
     */
    async resetMotorPos(port, relative, noReply) {
        const res = await this.send(CommandTypes.control, Commands.resetMotorPos, { port, relative }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Gets the battery level of the NXT
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & { voltage: number }>}
     */
    async getBattery(noReply) { 
        const res = await this.send(CommandTypes.control, Commands.getBattery, {}, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Stops all sounds on the NXT
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn>}
     */
    async stopSounds(noReply) { 
        const res = await this.send(CommandTypes.control, Commands.stopSounds, {}, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Asks th NXT to reset its sleep timer, returns how long the NXT intends to wait before sleeping
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & { sleepLength: number }>}
     */
    async keepAlive(noReply) { 
        const res = await this.send(CommandTypes.control, Commands.keepAlive, {}, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Gets the status info of the lowspeed (input) ports on the NXT
     * @param {InputPorts} port 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & { maxBytes: number }>}
     */
    async lowspeedStatus(port, noReply) {
        const res = await this.send(CommandTypes.control, Commands.lowspeedStatus, { port }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Write arbitrary data to the NXTs input ports
     * @param {InputPorts} port 
     * @param {number} lengthSent The length of the data to send
     * @param {number} lengthRecieved The length of the data to expect back
     * @param {Buffer} data 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn>}
     */
    async lowspeedWrite(port, lengthSent, lengthRecieved, data, noReply) {
        const res = await this.send(CommandTypes.control, Commands.lowspeedWrite, { port, lengthSent, lengthRecieved, data }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Get the data we expected from an input port
     * @param {InputPorts} port 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & { bytesFetched: number, bytes: Buffer }>}
     */
    async lowspeedRead(port, noReply) {
        const res = await this.send(CommandTypes.control, Commands.lowspeedRead, { port }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Gets the filename of the currently running program on the NXT
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & { filename: string }>}
     */
    async currentProgram(noReply) { 
        const res = await this.send(CommandTypes.control, Commands.currentProgram, {}, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * 
     * @param {number} remoteInbox 
     * @param {number} inbox 
     * @param {boolean} shouldRemove 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & { inbox: number, length: number, message: string }>}
     */
    async messageRead(remoteInbox, inbox, shouldRemove, noReply) {
        const res = await this.send(CommandTypes.control, Commands.messageRead, { remoteInbox, inbox, shouldRemove }, noReply);
        this.makeError(res);
        return res;
    }
    // system commands
    /**
     * Opens a file on the NXT for reading
     * @param {string} filename 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & { handle: number }>}
     */
    async openReadFile(filename, noReply) {
        const res = await this.send(CommandTypes.system, Commands.openReadFile, { filename }, noReply);
        this.makeError(res);
        this.openFileHandles.push(res.handle);
        return res;
    }
    /**
     * Opens a file on the NXT for writing
     * @param {string} filename 
     * @param {number} size 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & { handle: number }>}
     */
    async openWriteFile(filename, size, noReply) {
        const res = await this.send(CommandTypes.system, Commands.openWriteFile, { filename, size }, noReply);
        this.makeError(res);
        this.openFileHandles.push(res.handle);
        return res;
    }
    /**
     * Read data from a file on the NXT, reads sequentially rather than just the first segment
     * @param {number} handle 
     * @param {number} length 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & {
     *     handle: number,
     *     length: number,
     *     data: Buffer
     * }>}
     */
    async readFile(handle, length, noReply) {
        const res = await this.send(CommandTypes.system, Commands.readFile, { handle, length }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Writes data to a file on the NXT, writes sequentially rather than just the first segment
     * @param {number} handle 
     * @param {Buffer} data 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & { handle: number, length: number }>}
     */
    async writeFile(handle, data, noReply) {
        const res = await this.send(CommandTypes.system, Commands.writeFile, { handle, data }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Close a file handle on the NXT
     * @param {number} handle 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & { handle: number }>}
     */
    async closeFile(handle, noReply) {
        const res = await this.send(CommandTypes.system, Commands.closeFile, { handle }, noReply);
        this.makeError(res);
        this.openFileHandles.splice(this.openFileHandles.indexOf(handle), 1);
        return res;
    }
    /**
     * Removes a file by name from the NXT
     * @param {string} filename 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & { filename: string }>}
     */
    async deleteFile(filename, noReply) {
        const res = await this.send(CommandTypes.system, Commands.deleteFile, { filename }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Finds a file by name on the NXT, opens the file for find next
     * @param {string} filename 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & {
     *     handle: number,
     *     filename: string,
     *     size: number
     * }>}
     */
    async findFile(filename, noReply) {
        const res = await this.send(CommandTypes.system, Commands.findFile, { filename }, noReply);
        this.makeError(res);
        this.openFileHandles.push(res.handle);
        return res;
    }
    /**
     * Finds the next file that matches the search string on handle
     * @param {number} handle 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & {
     *     handle: number,
     *     filename: string,
     *     size: number
     * }>}
     */
    async findNextFile(handle, noReply) {
        const res = await this.send(CommandTypes.system, Commands.findNextFile, { handle }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Gets the NXTs firmware version
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & {
     *     protocolVersion: number,
     *     firmwareVersion: number
     * }>}
     */
    async firmwareVersion(noReply) { 
        const res = await this.send(CommandTypes.system, Commands.firmwareVersion, {}, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Open a file for writing, but such that it is explicitly byte-for-byte inline on the flash
     * @param {string} filename 
     * @param {number} size 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & { handle: number }>}
     */
    async openWriteLinearFile(filename, size, noReply) {
        const res = await this.send(CommandTypes.system, Commands.openWriteLinearFile, { filename, size }, noReply);
        this.makeError(res);
        this.openFileHandles.push(res.handle);
        return res;
    }
    /**
     * Open a linear file for reading, does nothing on stock firmware
     * @param {string} filename 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & { handle: number }>}
     */
    async openReadLinearFile(filename, noReply) {
        const res = await this.send(CommandTypes.system, Commands.openReadLinearFile, { filename }, noReply);
        this.makeError(res);
        this.openFileHandles.push(res.handle);
        return res;
    }
    /**
     * Opens a file to be writen as pure data
     * @param {string} filename 
     * @param {number} size 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & { handle: number }>}
     */
    async openWriteDataFile(filename, size, noReply) {
        const res = await this.send(CommandTypes.system, Commands.openWriteDataFile, { filename, size }, noReply);
        this.makeError(res);
        this.openFileHandles.push(res.handle);
        return res;
    }
    /**
     * Open a file for appending to the end of it
     * @param {string} filename 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & { handle: number, maxSize: number }>}
     */
    async openAppendDataFile(filename, noReply) {
        const res = await this.send(CommandTypes.system, Commands.openAppendDataFile, { filename }, noReply);
        this.makeError(res);
        this.openFileHandles.push(res.handle);
        return res;
    }
    /**
     * Find a module on the NXT by name
     * @param {string} moduleName 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & {
     *     handle: number,
     *     name: string
     *     moduleID: number,
     *     size: number,
     *     mapSize: number
     * }>}
     */
    async findModule(moduleName, noReply) {
        const res = await this.send(CommandTypes.system, Commands.findModule, { moduleName }, noReply);
        this.makeError(res);
        this.openFileHandles.push(res.handle);
        return res;
    }
    /**
     * Find the next module on the NXT by search handle
     * @param {string} moduleName 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & {
     *     handle: number,
     *     name: string
     *     moduleID: number,
     *     size: number,
     *     mapSize: number
     * }>}
     */
    async findNextModule(handle, noReply) {
        const res = await this.send(CommandTypes.system, Commands.findNextModule, { handle }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Closes an open module search handle
     * @param {number} handle 
     * @param {number?} noReply 
     * @returns {Promise<CommandReturn & { handle: number }>}
     */
    async closeModule(handle, noReply) {
        const res = await this.send(CommandTypes.system, Commands.closeModule, { handle }, noReply);
        this.makeError(res);
        this.openFileHandles.splice(this.openFileHandles.indexOf(handle), 1);
        return res;
    }
    /**
     * Reads data from a modules IO map on the NXT
     * @param {number} moduleID 
     * @param {number} offset 
     * @param {number} length 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & {
     *     moduleID: number,
     *     length: number,
     *     data: Buffer
     * }>}
     */
    async readIOMap(moduleID, offset, length, noReply) {
        const res = await this.send(CommandTypes.system, Commands.readIOMap, { moduleID, offset, length }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Writes data to a modules IO map in the NXT
     * @param {number} moduleID 
     * @param {number} offset 
     * @param {number} length 
     * @param {Buffer} data 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & {
     *     moduleID: number,
     *     length: number
     * }>}
     */
    async writeIOMap(moduleID, offset, length, data, noReply) {
        const res = await this.send(CommandTypes.system, Commands.writeIOMap, { moduleID, offset, length, data }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Turn on the NXT
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & { wasValid: boolean }>}
     */
    async bootBrick(noReply) { 
        const res = await this.send(CommandTypes.system, Commands.bootBrick, {}, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Set the name of the NXT
     * @param {string} name 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn>}
     */
    async setBrickName(name, noReply) {
        const res = await this.send(CommandTypes.system, Commands.setBrickName, { name }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Get info about the NXT
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & {
     *     name: string,
     *     bluetoothAddress: string,
     *     channelQualities: [number,number,number,number],
     *     availableFlash: number
     * }>}
     */
    async deviceInfo(noReply) { 
        const res = await this.send(CommandTypes.system, Commands.deviceInfo, {}, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Formats the flash inside the NXT
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn>}
     */
    async formatFlash(noReply) { 
        const res = await this.send(CommandTypes.system, Commands.formatFlash, {}, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Gets the length of a specific poll buffer
     * @param {PollBuffers} buffer 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & {
     *     buffer: PollBuffers,
     *     length: number
     * }>}
     */
    async pollLength(buffer, noReply) {
        const res = await this.send(CommandTypes.system, Commands.pollLength, { buffer }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Read data from the poll buffer
     * @param {PollBuffers} buffer 
     * @param {number} length 
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn & {
     *     buffer: PollBuffers,
     *     length: number,
     *     data: Buffer
     * }>}
     */
    async poll(buffer, length, noReply) {
        const res = await this.send(CommandTypes.system, Commands.poll, { buffer, length }, noReply);
        this.makeError(res);
        return res;
    }
    /**
     * Factory reset the NXTs bluetooth configuration
     * @param {boolean?} noReply 
     * @returns {Promise<CommandReturn>}
     */
    async bluetoothFactoryReset(noReply) { 
        const res = await this.send(CommandTypes.system, Commands.bluetoothFactoryReset, {}, noReply);
        this.makeError(res);
        return res;
    }
    // upload/download stream manage, cause theres a command standard for this
    /**
     * Put a file of any size on to the NXT
     * @param {string} filename 
     * @param {Buffer|string} data 
     */
    async downloadFile(filename, data) {
        if (typeof data === 'string') data = Buffer.from(data);
        await this.deleteFile(filename).catch(err => { if (err.status === Status.fileNotFound) return null; throw err });
        const ext = path.extname(filename).toLowerCase();
        let handle;
        switch (ext) {
        case '.rxe': case '.sys': case '.rtm': case '.ric':
        case '.rdt':
            ({handle} = this.openWriteDataFile(filename, Math.ceil(data.length / 61) * 61)); break;
        default:
            ({handle} = this.openWriteFile(filename, Math.ceil(data.length / 61) * 61)); break;
        }
        let offset = 0;
        let lastLen = data.length;
        while ((data.length - offset) > 0) {
            const padded = Buffer.alloc(lastLen);
            data.copy(padded, 0, offset);
            const { length, handle: newHandle } = await this.writeFile(handle, padded);
            handle = newHandle;
            offset += length;
            lastLen = length;
        }
        await this.closeFile(handle);
    }
    /**
     * Get a file of any size from the NXT
     * @param {string} filename 
     * @param {number?} length If unset the data read back will be the complete file
     */
    async uploadFile(filename, length) {
        let { handle, size } = await this.openReadFile(filename);
        length ||= size;
        const res = Buffer.alloc(length);
        let offset = 0;
        let lastLength = 58
        while (length - offset) {
            // not explicitly supported, but pFlash never gets reset so we end up
            // reading forward in the file on each step
            const { length: resLength, data, handle: newHandle } = await this.readFile(handle, Math.min(length - offset, lastLength));
            handle = newHandle;
            data.copy(res, offset);
            offset += resLength;
            lastLength = resLength
        }
        await this.closeFile(handle);
        return res;
    }
    checkModule(id, rules) {
        const producer = id >> 24;
        const ident = (id >> 16) & 0xFF;
        const verMajor = (id >> 8) & 0xFF;
        const verMinor = id & 0xFF;
        if (!rules) return {
            producer,
            id: ident,
            verMajor,
            verMinor
        }
        let good = true;
        if (rules.producer) {
            if (typeof rules.producer === 'number') good &&= producer === rules.producer;
            else {
                if (typeof rules.producer[0] !== 'number') rules.producer[0] = -Infinity;
                if (typeof rules.producer[1] !== 'number') rules.producer[1] = Infinity;
                good &&= producer > rules.producer[0] && producer < rules.producer[1];
            }
        }
        if (rules.id) {
            if (typeof rules.id === 'number') good &&= ident === rules.id;
            else {
                if (typeof rules.id[0] !== 'number') rules.id[0] = -Infinity;
                if (typeof rules.id[1] !== 'number') rules.id[1] = Infinity;
                good &&= ident > rules.id[0] && ident < rules.id[1];
            }
        }
        if (rules.verMajor) {
            if (typeof rules.verMajor === 'number') good &&= verMajor === rules.verMajor;
            else {
                if (typeof rules.verMajor[0] !== 'number') rules.verMajor[0] = -Infinity;
                if (typeof rules.verMajor[1] !== 'number') rules.verMajor[1] = Infinity;
                good &&= verMajor > rules.verMajor[0] && verMajor < rules.verMajor[1];
            }
        }
        if (rules.verMinor) {
            if (typeof rules.verMinor === 'number') good &&= verMinor === rules.verMinor;
            else {
                if (typeof rules.verMinor[0] !== 'number') rules.verMinor[0] = -Infinity;
                if (typeof rules.verMinor[1] !== 'number') rules.verMinor[1] = Infinity;
                good &&= verMinor > rules.verMinor[0] && verMinor < rules.verMinor[1];
            }
        }
        return good;
    }
}
module.exports = NXTCommunication;