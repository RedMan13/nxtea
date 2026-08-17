const parseArgs = require('./argument-parser');
global.args = parseArgs({
    executable: [['e', 'default'], {  }, 'The NXT Executable file to run.'],
    fading: [['f'], { default: false, noValue: true }, 'If the emulator should also emulate NXT LCD fading.'],
    colorOn: [['F'], { default: '0,0,0,255', match: /[0-9]+,[0-9]+,[0-9]+,[0-9]+/i }, 'The color that should be used for pixels that are turned on, as a RGBA CSV.'],
    colorOff: [['B'], { default: '18,41,18,255', match: /[0-9]+,[0-9]+,[0-9]+,[0-9]+/i }, 'The color that should be used for the background/turned off pixels, as a RGBA CSV.'],
    pixelSize: [['P', 's'], { default: 4, match: /[0-9]+/i }, 'The size that each pixel should be for the screen.'],
    bluetooth: [['b'], { default: false, noValue: true }, 'Sets if bluetooth should be selected normally. Will hang the program if no bluetooth nor usb devices exist to connect with.'],
    target: [['t'], {  }, 'Sets up a connection with an NXT brick over USB, if unset it will just be the first recognisable devices, otherwise it is one of usb device id, bluetooth address, or NXT name.'],
    capture: [['c'],  { needs: ['target'], default: false, noValue: true }, 'If we should be using captured frames from the NXT instead of running the executable, if a file is provided anyways the file will be uploaded to the NXT and ran.'],
    pollRate: [['p'], { default: 260, match: /[0-9]+/i }, 'For capture. The milisecond interval that we should poll the NXT screen at.'],
    list: [['l'], { needs: ['target'], default: false, noValue: true }, 'List all NXT devices that can be connected.'],
    upload: [['u'], { needs: ['target'], repeatable: true }, 'Sets a file that will be uploaded to the selected NXT.'],
    download: [['d'], { needs: ['target'], repeatable: true }, 'Requests a file to be downloaded from the NXT.'],
    delete: [['r'], { needs: ['target'], repeatable: true }, 'Requests that a file be deleted by name.'],
    info: [['i'], { needs: ['target'], default: false, noValue: true }, 'Requests that info about the NXT be dumped to the terminal.']
}, process.argv);

const { render, decodeBinnary } = require('nxtRICfileUtil');
const fs = require('fs');
const path = require('path');
const VirtualMachine = require('./virtual-machine');
const syscalls = require('./node-calls');
const NXTCommunication = require('./nxt-communication');
const makeDebugger = require('./debugger');

function toPower(num, name) {
    const tera = num / 1000_000_000_000;
    if (Math.floor(tera)) return `${tera.toFixed(2)}t${name}`;
    const giga = num / 1000_000_000;
    if (Math.floor(giga)) return `${giga.toFixed(2)}g${name}`;
    const mega = num / 1000_000;
    if (Math.floor(mega)) return `${mega.toFixed(2)}m${name}`;
    const kila = num / 1000;
    if (Math.floor(kila)) return `${kila.toFixed(2)}k${name}`;
    const single = num;
    return `${single}${name}`;
}
(async () => {
    // check if we need to go do nothing and just list devices
    if (args.list) {
        const devices = await NXTCommunication.listDevices();
        if (devices.length <= 0) console.log('No NXT devices accessable');
        for (const device of devices) {
            const comm = new NXTCommunication(device);
            const info = await comm.deviceInfo();
            comm.makeError(info);
            console.log('usbAddress:', device.device.deviceAddress, '\tbtAddress:', info.bluetoothAddress, '\tname:', info.name);
        }
        process.exit(0);
    }

    // setup the VM, we may not need it but it will definitly be helpful
    const root = path.dirname(args.executable ?? process.cwd() + '/rizz');
    const vm = new VirtualMachine();
    vm.syscalls = syscalls(vm, root);
    // bind draw calls
    vm.syscalls[VirtualMachine.SystemCalls.DrawCircle] = (ret, pos, rad, opts) =>
        render.draw('Circle', opts.value, pos.get(0), pos.get(1), rad.value);
    vm.syscalls[VirtualMachine.SystemCalls.DrawLine] = (ret, pos1, pos2, opts) =>
        render.draw('Line', opts.value, pos1.get(0), pos1.get(1), pos2.get(0), pos2.get(1));
    vm.syscalls[VirtualMachine.SystemCalls.DrawPicture] = (ret, pos, file, args, opts) => {
        const ctx = decodeBinnary(fs.readFileSync(file.asString()));
        render.draw('RICDraw', opts.value, pos.get(0), pos.get(1), ctx, args);
    }
    vm.syscalls[VirtualMachine.SystemCalls.DrawPoint] = (ret, pos, opts) =>
        render.draw('Pixel', opts.value, pos.get(0), pos.get(1));
    vm.syscalls[VirtualMachine.SystemCalls.DrawRect] = (ret, pos, size, opts) =>
        render.draw('Rectangle', opts.value, pos.get(0), pos.get(1), size.get(0) +1, size.get(1) +1);
    vm.syscalls[VirtualMachine.SystemCalls.DrawText] = (ret, pos, text, opts) => 
        render.draw('TextBox', opts.value, pos.get(0), pos.get(1), text.asString());
    
    // setup communications if needed
    if (args.target) {
        /** @type {NXTCommunication} */
        let comms;
        let info;
        process.on('uncaughtException', async err => {
            if (comms) await comms.close();
            console.error(err);
            process.exit(-1);
        });

        if (typeof args.target === 'string') {
            const devices = await NXTCommunication.listDevices();
            for (const toCheck of devices) {
                if (args.target == toCheck.device.deviceAddress) break;
                comms = new NXTCommunication(toCheck, root, vm); await comms.ready;
                comms.enableFileAccess = false;
                info = await comms.deviceInfo();
                if (info.bluetoothAddress === args.target) break;
                if (info.name === args.target) break;
            }
            if (args.bluetooth) {
                if (!comms) {
                    const serial = await NXTCommunication.bluetoothSearch(args.target);
                    comms = new NXTCommunication(serial, root, vm);
                }
                if (!comms.btSerial) await comms.upgrade().catch(() => console.warn('Couldnt upgrade connection to bluetooth.'));
                console.log('Finished bluetooth connection');
            }
        }

        comms ??= new NXTCommunication(null, root, vm); await comms.ready;
        info ??= await comms.deviceInfo();
        console.log('Connected to', info.name);
        if (args.info) {
            const info = await comms.deviceInfo();
            console.log('Name:', info.name);
            console.log('Bluetooth Address:', info.bluetoothAddress);
            console.log('Channel Qualities:', info.channelQualities);
            console.log('Available Flash:', toPower(info.availableFlash, 'b'));
            console.log('');
            const versions = await comms.firmwareVersion();
            console.log('Protocol Version', versions.protocolVersion);
            console.log('Firmware Version', versions.firmwareVersion);
            console.log('');
            const battery = await comms.getBattery();
            console.log('Voltage', battery.voltage / 1000);
            console.log('');
            const { handle, filename, size } = await comms.findFile('*.*');
            console.log(filename, toPower(size, 'b'));
            while (true) {
                const { filename, size } = await comms.findNextFile(handle).catch(err => { if (err.status === NXTCommunication.Status.fileNotFound) return err.data; throw err });
                if (!filename) break;
                console.log(filename, '\t', toPower(size, 'b'));
            }
            await comms.closeFile(handle);
            console.log('');
            const { handle: module, name, mapSize, moduleID } = await comms.findModule('*.*');
            await comms.closeModule(module);
            console.log(name, moduleID.toString(16).padStart(8, '0'), toPower(mapSize, 'b'));
            while (true) {
                const { name, mapSize, moduleID } = await comms.findNextModule(module).catch(err => { if (err.status === NXTCommunication.Status.moduleNotFound) return err.data; throw err });
                if (!name) break;
                console.log(name, '\t', moduleID.toString(16).padStart(8, '0'), '\t', toPower(mapSize, 'b'));
            }
            await comms.closeModule(module);
        }
        if (args.upload) {
            for (const file of args.upload) {
                const isDir = fs.statSync(file).isDirectory();
                if (isDir) {
                    const files = fs.readdirSync(file);
                    for (const name of files) {
                        const real = path.resolve(file, name);
                        if (fs.statSync(real).isDirectory()) continue;
                        await comms.downloadFile(name, fs.readFileSync(real));
                    }
                } else {
                    const parsed = path.parse(file);
                    await comms.downloadFile(parsed.base, fs.readFileSync(file));
                }
            }
        }
        if (args.download) {
            for (const file of args.download) {
                const { handle, filename, size } = await comms.findFile(file);
                await comms.closeFile(handle);
                fs.writeFileSync(filename, await comms.uploadFile(filename, size));
            }
        }
        if (args.delete) {
            for (const file of args.delete)
                await comms.deleteFile(file);
        }
        if (args.capture) {
            const document = require('./render');
            if (args.executable) {
                await comms.stopProgram().catch(() => {});
                await comms.downloadFile('nxtea-copy.rxe', fs.readFileSync(args.executable));
                await comms.startProgram('nxtea-copy.rxe');
            }
            const { moduleID: displayId, handle: display } = await comms.findModule('Display.*');
            await comms.closeModule(display);
            if (!comms.checkModule(displayId, { id: NXTCommunication.ModuleIds.display }))
                throw new Error('Could not get the display module from the NXT');
            const { moduleID: uiID, handle: ui } = await comms.findModule('Ui.*');
            await comms.closeModule(ui);
            if (!comms.checkModule(uiID, { id: NXTCommunication.ModuleIds.ui }))
                console.warn('Could not get the UI module from the NXT, window inputs will be dissabled');
            else {
                document.on('keydown', async e => {
                    let buttonCode;
                    let buttonKey
                    switch (e.code) {
                    default: return;
                    case 'ArrowUp':
                    case 'Enter':
                    case 'KeyW': buttonCode = 2; buttonKey = 3; break;
                    case 'ArrowDown':
                    case 'Escape':
                    case 'KeyS':
                        buttonCode = 4;
                        buttonKey = 0;
                        // stop any running programs, as thats what exit normally does
                        comms.stopProgram(true);
                        break;
                    case 'ArrowLeft':
                    case 'KeyA': buttonCode = 1; buttonKey = 2; break;
                    case 'ArrowRight':
                    case 'KeyD': buttonCode = 3; buttonKey = 1; break;
                    }
                    await comms.writeIOMap(uiID, 28, 1, Buffer.from([buttonCode]));
                });
            }
            (async function getFrame() {
                const start = Date.now();
                let offset = 119;
                let requested = 800;
                while (requested > 0) {
                    const { data, length } = await comms.readIOMap(displayId, offset, requested);
                    let x = 0;
                    let y = 0;
                    for (let i = 0; i < length; i++) {
                        // the array is height/width inside the NXT
                        y = Math.floor(((offset + i) - 119) / 100);
                        x = ((offset + i) - 119) % 100;
                        if (!render.frame[x]) break;
                        render.frame[x][render.height - ((y * 8) +8)] = (data[i] >> 7) & 1;
                        render.frame[x][render.height - ((y * 8) +7)] = (data[i] >> 6) & 1;
                        render.frame[x][render.height - ((y * 8) +6)] = (data[i] >> 5) & 1;
                        render.frame[x][render.height - ((y * 8) +5)] = (data[i] >> 4) & 1;
                        render.frame[x][render.height - ((y * 8) +4)] = (data[i] >> 3) & 1;
                        render.frame[x][render.height - ((y * 8) +3)] = (data[i] >> 2) & 1;
                        render.frame[x][render.height - ((y * 8) +2)] = (data[i] >> 1) & 1;
                        render.frame[x][render.height - ((y * 8) +1)] = data[i] & 1;
                    }
                    offset += length;
                    requested -= length;
                }
                const toWait = args.pollRate - (Date.now() - start);
                if (toWait < 0) console.warn(`Could not complete frame grab in time, took ${Math.abs(toWait)}MS to long`);
                // we HAVE to keep proper order, or else we get a completely uninteligable result
                setTimeout(getFrame, toWait);
            })();
        } else comms.close();
    } else {
        require('./render');
        // finally, check if we even have a file to load
        if (!fs.existsSync(args.executable)) {
            let osc = false;
            setInterval(() => {
                osc = !osc;
                render.clear('whole');
                render.draw('Rectangle', osc ? 0b100000 : 0b000000, 0, 31, 100, 11);
                render.draw('TextBox', osc ? 0b000100 : 0b000000, 2, 32, 'No File Provided');
            }, 1000);
        } else {
            const data = fs.readFileSync(args.executable);
            vm.load(data, args.executable);
            // makeDebugger(vm);
            let inter;
            inter = setInterval(() => {
                vm.step();
                if (vm.runQueue.length <= 0) return clearInterval(inter);
            }, 0);
        }
    }
})();