const path = require('path');
const fs = require('fs/promises');
const { createReadStream, createWriteStream, mkdirSync } = require('fs');
const JSZip = require('jszip');

const output = path.resolve(__dirname, './nxtea');
mkdirSync(output, { recursive: true });
const node_modules = path.resolve(__dirname, 'node_modules');
const modules = new JSZip();
async function uploadModules(package) {
    for (const dep in package.dependencies) {
        try { await uploadModules(require(`${dep}/package.json`)); } catch (err) {}
        const dir = path.resolve(require.resolve(`${dep}/package.json`), '..');
        const files = await fs.readdir(dir, { recursive: true });
        for (const name of files) {
            const file = path.resolve(dir, name);
            if ((await fs.stat(file)).isDirectory()) continue;
            const real = path.relative(node_modules, file);
            modules.file(real, createReadStream(file));
        }
    }
}
uploadModules(require('./package.json'))
    .then(() => {
        const res = createWriteStream(path.resolve(output, `./${process.platform}.${process.arch}.modules.zip`));
        const generated = modules.generateNodeStream({ compression: 'DEFLATE' });
        generated.pipe(res);
    });