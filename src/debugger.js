const { Opcodes, CompareOpcodes, SystemCalls } = require('./virtual-machine');
const { Int16, UInt8, DataspaceEntryType } = require('./types');

const topClump = '┏';
const midClump = '┃';
const endClump = '┗';
const clumpOneline = '║';
const onewayJump = '─';
const topJump = '┐';
const midJump = '│';
const endJump = '┘';
const topSubcallInbound = '┌';
const topSubcallOutbound = '╒'
const midSubcall = '│';
const endSubcallInbound = '└';
const endSubcallOutbound = '╘';
const samewayTopJump = '┬';
const fourwayJump = '┼';
const samewayEndJump = '┴';
const passwayTopSubcall = '┲';
const passwayMidSubcall = '╂';
const passwayEndSubcall = '┺';
const samewayTopSubcallInbound = '┬';
const samewayTopSubcallOutbound = '╤';
const fourwaySubcallInbound = '┼';
const fourwaySubcallOutbound = '╪';
const samewayEndSubcallInbound = '┴';
const samewayEndSubcallOutbound = '╧';
const onewaySubcallInbound = '─';
const onewaySubcallOutbound = '═';
const subcallOnelineInbound = '╢';
const subcallOnelineOutbound = '╣';
const indentSymbol = ' ';
const unwired = 0xFF;
/**
 * @param {VirtualMachine} vm 
 */
module.exports = function makeDebugger(vm) {
    function referenceVariable(id, out) {
        if (id === unwired) return '\x1b[33mNA\x1b[39m';
        return `\x1b[${out ? '34' : '32'}m${id}\x1b[39m`;
    }
    function referenceImmediate(num) {
        return `\x1b[33m${num}\x1b[39m`;
    }
    const codeString = [];
    const calls = [];
    const jumps = [];
    let lineMaxHeight = 0;
    for (const idx in vm.codespace) {
        const command = vm.codespace[idx];
        switch (command.opcode) {    
        case Opcodes.CMP:
            codeString.push(''.concat('CMP', CompareOpcodes[command.cmpOpcode], ' ', referenceVariable(command.args[0], true), ' ', referenceVariable(command.args[1]), ' ', referenceVariable(command.args[2])));
            break;
        case Opcodes.TST:
            codeString.push(''.concat('TST', CompareOpcodes[command.cmpOpcode], ' ', referenceVariable(command.args[0], true), ' ', referenceVariable(command.args[1])));
            break;
        case Opcodes.ARRBUILD:   
            codeString.push(''.concat('ARRBUILD ', referenceVariable(command.args[0], true), ' [', command.args.slice(1).map(referenceImmediate).join(', '), ']'));
            break; 
        case Opcodes.SET:
            codeString.push(''.concat('SET ', referenceVariable(command.args[0], true), ' ', referenceImmediate(command.args[1])));
            break;
        case Opcodes.JMP: {
            const address = command.address + (Int16.cast(command.args[0]) *2);
            const target = vm.codespace.findIndex(word => word.address === address);
            jumps.push([codeString.length, target]);
            codeString.push(''.concat('JMP ', referenceImmediate(target - idx)));
            break;
        }
        case Opcodes.BRCMP: {
            const address = command.address + (Int16.cast(command.args[0]) *2);
            const target = vm.codespace.findIndex(word => word.address === address);
            jumps.push([codeString.length, target]);
            codeString.push(''.concat('BRCMP', CompareOpcodes[command.cmpOpcode], ' ', referenceImmediate(target - idx), ' ', referenceVariable(command.args[1]), ' ', referenceVariable(command.args[2])));
            break;
        }
        case Opcodes.BRTST: {
            const address = command.address + (Int16.cast(command.args[0]) *2);
            const target = vm.codespace.findIndex(word => word.address === address);
            jumps.push([codeString.length, target]);
            codeString.push(''.concat('BRTST', CompareOpcodes[command.cmpOpcode], ' ', referenceImmediate(target - idx), ' ', referenceVariable(command.args[1])));
            break;
        }
        case Opcodes.FINCLUMP:
            codeString.push(''.concat('FINCLUMP ', referenceImmediate(Int16.cast(command.args[1])), ' ', referenceImmediate(Int16.cast(command.args[1]))));
            break;
        case Opcodes.FINCLUMPIMMED:
            codeString.push(''.concat('FINCLUMPIMMED ', referenceImmediate(Int16.cast(command.args[1]))));
            break;
        case Opcodes.SUBCALL:
            calls.push([codeString.length, vm.clumps[command.args[0]].codeStart]);
            codeString.push(''.concat('SUBCALL ', referenceImmediate(command.args[0]), ' ', referenceVariable(command.args[1])));
            break;
        case Opcodes.SYSCALL:
            codeString.push(''.concat('SYSCALL ', SystemCalls[command.args[0]] ?? referenceImmediate(command.args[0]), ' ', referenceVariable(command.args[1])));
            break;
        case Opcodes.SETIN:
            codeString.push(''.concat('SETIN ', referenceVariable(command.args[0]), ' ', referenceVariable(command.args[1]), ' ', referenceImmediate(command.args[2])));
            break;
        case Opcodes.SETOUT:
            codeString.push(''.concat('SETOUT ', referenceVariable(command.args[0]), ' [', command.args.slice(1).map((m, i) => i % 2 ? referenceVariable(m) : referenceImmediate(m))).join(', '), '] ');
            break;
        case Opcodes.GETIN:
            codeString.push(''.concat('GETIN ', referenceVariable(command.args[0]), ' ', referenceVariable(command.args[1]), ' ', referenceImmediate(command.args[2])));
            break;
        case Opcodes.GETOUT:
            codeString.push(''.concat('GETOUT ', referenceVariable(command.args[0]), ' ', referenceVariable(command.args[1]), ' ', referenceImmediate(command.args[2])));
            break;

        case Opcodes.ADD:
        case Opcodes.SUB:
        case Opcodes.NEG:
        case Opcodes.MUL:
        case Opcodes.DIV:
        case Opcodes.MOD:
        case Opcodes.AND:
        case Opcodes.OR:
        case Opcodes.XOR:
        case Opcodes.NOT:
        case Opcodes.CMPSET:
        case Opcodes.TSTSET:
        case Opcodes.CMNT:
        case Opcodes.LSL:
        case Opcodes.LSR:
        case Opcodes.ASL:
        case Opcodes.ASR:
        case Opcodes.ROTL:
        case Opcodes.ROTR:
        case Opcodes.INDEX:
        case Opcodes.REPLACE:
        case Opcodes.ARRSIZE:
        case Opcodes.ARRSUBSET:
        case Opcodes.ARRINIT:
        case Opcodes.MOV:
        case Opcodes.FLATTEN:
        case Opcodes.UNFLATTEN:
        case Opcodes.NUMTOSTRING:
        case Opcodes.STRINGTONUM:
        case Opcodes.STRCAT:
        case Opcodes.STRSUBSET:   
        case Opcodes.STRTOBYTEARR:
        case Opcodes.BYTEARRTOSTR:
        case Opcodes.STOP:
        case Opcodes.ACQUIRE:
        case Opcodes.RELEASE:
        case Opcodes.SUBRET:
        case Opcodes.WAIT:
        case Opcodes.GETTICK:
            codeString.push(''.concat(Opcodes[command.opcode], ' ', command.args.map((arg, i) => referenceVariable(arg, !i)).join(' ')));
            break;
        default: codeString.push(''.concat(command.opcode, ' ', command.cmpOpcode, ' [', command.args.join(', '), ']'));
        }
        lineMaxHeight = Math.max(lineMaxHeight, codeString.at(-1).replace(/\x1b\[[0-9;]+m/g, '').length);
    }
    jumps.sort((a,b) => (Math.max(...a) - Math.min(...a)) - (Math.max(...b) - Math.min(...b)));
    let maxJumpLineLen = 0;
    for (const jump of jumps) {
        const children = jumps
            .filter(([from, to]) => jump[0] > jump[1] 
                ? (from <= jump[0] && from >= jump[1]) || (to <= jump[0] && to >= jump[1]) 
                : (from <= jump[1] && from >= jump[0]) || (to <= jump[1] && to >= jump[0]));
        let length = children.length;
        let goingDown = true;
        while (children.some(([,, indent]) => indent === length)) {
            if (goingDown) length--;
            else length++;
            if (length < 0) {
                length = children.length +1;
                goingDown = false;
            }
        }
        maxJumpLineLen = Math.max(maxJumpLineLen, length +1);
        jump[2] = length;
    }
    for (let i = 0; i < codeString.length; i++) {
        const padLength = lineMaxHeight - codeString[i].replace(/\x1b\[[0-9;]+m/g, '').length;
        const isJump = jumps.some(([from, to]) => i === from || i === to);
        codeString[i] = codeString[i] + (isJump ? onewayJump : indentSymbol).repeat(padLength);
    }
    for (let i = 0; i < codeString.length; i++) {
        const lines = jumps.filter(([from, to]) => to < from ? i <= from && i >= to : i <= to && i >= from);
        const length = codeString[i].length;
        codeString[i] = codeString[i] + indentSymbol.repeat(maxJumpLineLen);
        for (let j = 0; j < lines.length; j++) {
            const line = lines[j][2];
            const flip = lines[j][0] > lines[j][1];
            if (flip ? lines[j][1] === i : lines[j][0] === i) {
                for (let k = line + length -1; k >= length; k--) {
                    if (codeString[i][k] === midJump)
                        codeString[i] = codeString[i].slice(0, k) + fourwayJump + codeString[i].slice(k +1);
                    if (codeString[i][k] === topJump)
                        codeString[i] = codeString[i].slice(0, k) + samewayTopJump + codeString[i].slice(k +1);
                    if (codeString[i][k] === endJump)
                        codeString[i] = codeString[i].slice(0, k) + samewayEndJump + codeString[i].slice(k +1);
                    if (codeString[i][k] === indentSymbol)
                        codeString[i] = codeString[i].slice(0, k) + onewayJump + codeString[i].slice(k +1);
                }
                if (codeString[i][line + length] === onewayJump)
                    codeString[i] = codeString[i].slice(0, line + length) + samewayTopJump + codeString[i].slice(line + length +1);
                if (codeString[i][line + length] === indentSymbol)
                    codeString[i] = codeString[i].slice(0, line + length) + topJump + codeString[i].slice(line + length +1);
                continue;
            }
            if (flip ? lines[j][0] === i : lines[j][1] === i) {
                for (let k = line + length -1; k >= length; k--) {
                    if (codeString[i][k] === midJump)
                        codeString[i] = codeString[i].slice(0, k) + fourwayJump + codeString[i].slice(k +1);
                    if (codeString[i][k] === topJump)
                        codeString[i] = codeString[i].slice(0, k) + samewayTopJump + codeString[i].slice(k +1);
                    if (codeString[i][k] === endJump)
                        codeString[i] = codeString[i].slice(0, k) + samewayEndJump + codeString[i].slice(k +1);
                    if (codeString[i][k] === indentSymbol)
                        codeString[i] = codeString[i].slice(0, k) + onewayJump + codeString[i].slice(k +1);
                }
                if (codeString[i][line + length] === onewayJump)
                    codeString[i] = codeString[i].slice(0, line + length) + samewayEndJump + codeString[i].slice(line + length +1);
                if (codeString[i][line + length] === indentSymbol)
                    codeString[i] = codeString[i].slice(0, line + length) + endJump + codeString[i].slice(line + length +1);
                continue;
            }
            if (codeString[i][line + length] === indentSymbol)
                codeString[i] = codeString[i].slice(0, line + length) + midJump + codeString[i].slice(line + length +1);
            if (codeString[i][line + length] === onewayJump)
                codeString[i] = codeString[i].slice(0, line + length) + fourwayJump + codeString[i].slice(line + length +1);
        }
    }
    let indent = 1;
    for (const clump of vm.clumps) {
        if (clump.codeStart === (clump.codeEnd -1)) {
            codeString[clump.codeStart] = clumpOneline + codeString[clump.codeStart];
            continue;
        }
        codeString[clump.codeStart] = topClump + codeString[clump.codeStart];
        for (let i = clump.codeStart +1; i < (clump.codeEnd -1); i++)
            codeString[i] = midClump + codeString[i];
        codeString[clump.codeEnd -1] = endClump + codeString[clump.codeEnd -1];
    }
    for (let [from, to] of calls) {
        let fromIsOutbound = true;
        if (to < from) {
            const tmp = from;
            from = to;
            to = tmp;
            fromIsOutbound = false;
        }
        for (let i = 0; i < codeString.length; i++) {
            if (i >= from && i <= to) {
                if (i === from) {
                    for (let j = 0; j < indent; j++) {
                        if (j === (indent -1)) {
                            if (codeString[i][j] === topClump)
                                codeString[i] = codeString[i].slice(0,j) + passwayTopSubcall + codeString[i].slice(j +1);
                            if (codeString[i][j] === midClump)
                                codeString[i] = codeString[i].slice(0,j) + passwayMidSubcall + codeString[i].slice(j +1);
                            if (codeString[i][j] === endClump)
                                codeString[i] = codeString[i].slice(0,j) + passwayEndSubcall + codeString[i].slice(j +1);
                            if (codeString[i][j] === clumpOneline)
                                codeString[i] = codeString[i].slice(0,j) + (fromIsOutbound ? subcallOnelineOutbound : subcallOnelineInbound) + codeString[i].slice(j +1);
                            continue;
                        }
                        if (codeString[i][j] === midSubcall)
                            codeString[i] = codeString[i].slice(0,j) + (fromIsOutbound ? fourwaySubcallOutbound : fourwaySubcallInbound) + codeString[i].slice(j +1);
                        if (codeString[i][j] === topSubcallInbound || codeString[i][j] === topSubcallOutbound)
                            codeString[i] = codeString[i].slice(0,j) + (fromIsOutbound ? samewayTopSubcallOutbound : samewayTopSubcallInbound) + codeString[i].slice(j +1);
                        if (codeString[i][j] === endSubcallInbound || codeString[i][j] === endSubcallOutbound)
                            codeString[i] = codeString[i].slice(0,j) + (fromIsOutbound ? samewayEndSubcallOutbound : samewayEndSubcallInbound) + codeString[i].slice(j +1);
                        if (codeString[i][j] === indentSymbol)
                            codeString[i] = codeString[i].slice(0,j) + (fromIsOutbound ? onewaySubcallOutbound : onewaySubcallInbound) + codeString[i].slice(j +1);
                    }
                    codeString[i] = (fromIsOutbound ? topSubcallOutbound : topSubcallInbound) + codeString[i];
                    continue;
                }
                if (i === to) {
                    for (let j = 0; j < indent; j++) {
                        if (j === (indent -1)) {
                            if (codeString[i][j] === topClump)
                                codeString[i] = codeString[i].slice(0,j) + passwayTopSubcall + codeString[i].slice(j +1);
                            if (codeString[i][j] === midClump)
                                codeString[i] = codeString[i].slice(0,j) + passwayMidSubcall + codeString[i].slice(j +1);
                            if (codeString[i][j] === endClump)
                                codeString[i] = codeString[i].slice(0,j) + passwayEndSubcall + codeString[i].slice(j +1);
                            if (codeString[i][j] === clumpOneline)
                                codeString[i] = codeString[i].slice(0,j) + (!fromIsOutbound ? subcallOnelineOutbound : subcallOnelineInbound) + codeString[i].slice(j +1);
                            continue;
                        }
                        if (codeString[i][j] === midSubcall)
                            codeString[i] = codeString[i].slice(0,j) + (!fromIsOutbound ? fourwaySubcallOutbound : fourwaySubcallInbound) + codeString[i].slice(j +1);
                        if (codeString[i][j] === topSubcallInbound || codeString[i][j] === topSubcallOutbound)
                            codeString[i] = codeString[i].slice(0,j) + (!fromIsOutbound ? samewayTopSubcallOutbound : samewayTopSubcallInbound) + codeString[i].slice(j +1);
                        if (codeString[i][j] === endSubcallInbound || codeString[i][j] === endSubcallOutbound)
                            codeString[i] = codeString[i].slice(0,j) + (!fromIsOutbound ? samewayEndSubcallOutbound : samewayEndSubcallInbound) + codeString[i].slice(j +1);
                        if (codeString[i][j] === indentSymbol)
                            codeString[i] = codeString[i].slice(0,j) + (!fromIsOutbound ? onewaySubcallOutbound : onewaySubcallInbound) + codeString[i].slice(j +1);
                    }
                    codeString[i] = (!fromIsOutbound ? endSubcallOutbound : endSubcallInbound) + codeString[i];
                    continue;
                }
                codeString[i] = midSubcall + codeString[i];
                continue;
            }
            codeString[i] = indentSymbol + codeString[i];
        }
        indent++;
    }
    const lineNumLength = (String(codeString.length -1) + ': ').length;
    for (let i = 0; i < codeString.length; i++) {
        const num = (String(i) + ': ').padStart(lineNumLength, ' ');
        codeString[i] = num + codeString[i];
    }
    
    const left = String(vm.dataspaceUsed -1).length +1;
    for (let i = vm.dataspaceUsed -1; i >= 0; i--) {
        let string = vm.dataspaceTable[i].toString()
            .split('\n')
            .map((line,i) => (i > 0 ? ' '.repeat(left +2) : '') + line);
        if (vm.dataspaceTable[i].elementType instanceof UInt8)
            string = string.slice(0,3);
        process.stdout.write(`${String(i).padStart(left, ' ')}: (${DataspaceEntryType[vm.dataspaceTable[i].type]}) ${string.join('\n')}\n`);
    }

    process.stdout.write('\n\n' + codeString.join('\n'));
    setInterval(() => {
        /*process.stdout.write('\x1b[2J');
        for (const clump of vm.clumps) {
            const realPoint = clump.codeStart + clump.cursor;
            const toOut = codeString.slice(realPoint -2, realPoint +3);
            toOut[2] = `\x1b[${vm.runQueue.includes(clump.id) ? '44' : '41'}m${toOut[Math.min(realPoint, 2)]}\x1b[49m`;
            process.stdout.write(toOut.join('\n') + '\n\n');
        }
        const left = String(vm.dataspaceUsed -1).length +1;
        for (let i = vm.dataspaceUsed -1; i >= 0; i--) {
            let string = vm.dataspaceTable[i].toString()
                .split('\n')
                .map((line,i) => (i > 0 ? ' '.repeat(left +2) : '') + line);
            if (vm.dataspaceTable[i].elementType instanceof UInt8)
                string = string.slice(0,3);
            process.stdout.write(`${String(i).padStart(left, ' ')}: (${DataspaceEntryType[vm.dataspaceTable[i].type]}) ${string.join('\n')}\n`);
        }*/
    }, 1000 / 60);
}