const { render } = require('nxtRICfileUtil');
const fs = require('fs');
const twgl = require('twgl.js');
const { init } = require('3d-core-raub');
const { requestAnimationFrame, document, canvas, gl } = init({
    isWebGL2: true,
    isGles3: true,
    resizable: false,
    title: 'NXT Emulator'
});
document.width = render.width * args.pixelSize;
document.height = render.height * args.pixelSize;
document.getElementById = () => {};

const vert = fs.readFileSync(require.resolve('./sprite.vert.glsl'), 'utf8');
const frag = fs.readFileSync(require.resolve('./sprite.frag.glsl'), 'utf8');
const progInfo = twgl.createProgramInfo(gl, [vert, frag]);

const decayTime = 300
const colorOff = args.colorOff
    .split(/,\s*/g)
    .map(num => Number(num) || 0)
    .concat([0,0,0,0])
    .slice(0, 4);
const colorOn = args.colorOn
    .split(/,\s*/g)
    .map(num => Number(num) || 0)
    .concat([0,0,0,0])
    .slice(0, 4);
const screenLeft = -render.width / 2;
const screenRight = render.width / 2;
const screenTop = -render.height / 2;
const screenBottom = render.height / 2;
const screenBuffer = twgl.createBufferInfoFromArrays(gl, {
    position: [ 
        screenLeft, screenTop, 0,
        screenRight, screenTop, 0,
        screenLeft, screenBottom, 0, 
        screenRight, screenTop, 0,
        screenLeft, screenBottom, 0, 
        screenRight, screenBottom, 0, 
    ],
});
const textureBuffer = twgl.createTexture(gl, {
    min: gl.LINEAR,
    mag: gl.NEAREST,
    wrap: gl.CLAMP_TO_EDGE,
    width: 2,
    height: 2,
    src: [
        255,  0,255,255,   0,  0,  0,  0,
          0,  0,  0,  0, 255,  0,255,255,
    ]
});

const pixelState = new Array(render.width).fill([]).map(() => new Array(render.height).fill(0));
let dt = 0;
let dtStart = Date.now();
module.exports = document;
(function draw() {
    gl.viewport(0,0, canvas.width, canvas.height);
    gl.useProgram(progInfo.program);
    gl.clearColor(1,1,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const frame = [];
    for (let y = render.height -1; y >= 0; y--) {
        for (let x = 0; x < render.width; x++) {
            if (true != args.fading) {
                const color = render.frame[x][y] ? colorOn : colorOff;
                const alpha = Math.floor(color[3]);
                const mult = alpha / 255;
                frame.push(Math.floor(color[0]) * mult);
                frame.push(Math.floor(color[1]) * mult);
                frame.push(Math.floor(color[2]) * mult);
                frame.push(alpha);
                continue;
            }
            if (!render.frame[x][y]) pixelState[x][y] -= dt;
            else pixelState[x][y] += dt * 3;
            pixelState[x][y] = Math.min(Math.max(pixelState[x][y], 0), decayTime);
            const inter = (decayTime - pixelState[x][y]) / decayTime;
            const alpha = Math.floor(colorOn[3] + ((colorOff[3] - colorOn[3]) * inter));
            const mult = alpha / 255;
            frame.push(Math.floor(colorOn[0] + ((colorOff[0] - colorOn[0]) * inter)) * mult);
            frame.push(Math.floor(colorOn[1] + ((colorOff[1] - colorOn[1]) * inter)) * mult);
            frame.push(Math.floor(colorOn[2] + ((colorOff[2] - colorOn[2]) * inter)) * mult);
            frame.push(alpha);
        }
    }
    twgl.setTextureFromArray(gl, textureBuffer, frame, { width: render.width, height: render.height });

    const screenUniforms = {
        size: canvas.wh,
        src: { texture: textureBuffer },
        scale: [args.pixelSize,args.pixelSize],
        pos: [0,0],
        bottomLeft: [screenLeft, screenBottom],
        topRight: [screenRight, screenTop],
    };
    twgl.setBuffersAndAttributes(gl, progInfo, screenBuffer);
    twgl.setUniforms(progInfo, screenUniforms);
    twgl.drawBufferInfo(gl, screenBuffer);

    dt = Date.now() - dtStart;
    dtStart = Date.now();
    requestAnimationFrame(draw);
})()