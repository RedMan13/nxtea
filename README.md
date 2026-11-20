# NXTea
This is an NXT emulator and toolkit! Letting you control your NXT from your computer and debug NXT programs faster!

This is primarily a CLI tool, though both the emulator and the communications modules can be used externally in
graphical apps, as can be seen with the [demo page](<https://godslayerakp.serv00.net/nxtea/emulator>);

## Installing
All you need to do to install is download the installer for your flavor of OS, from the github releases or from the 
bellow URLs, then run it. This will install the necessary files to where needed and add its self to your path,
letting you run it anywhere.

- Linux: <https://godslayerakp.serv00.net/nxtea/linux>
- Windows: <https://godslayerakp.serv00.net/nxtea/windows.exe>

As i dont have a Mac system, i can not produce working installers for Mac systems. If you are using a Mac system,
you will need to run the project from source.

## Running From Source
First, make sure you have nodejs V20, you can check what version you have with `node -v`. If you do not have nodejs 
installed, you can get it from <nodejs>.

Download the source code via <guide>. Unzip the zip file, then open where ever you unzipped it to. Open a terminal 
in that folder and run `npm i`. Now you can run from source just by running `node ./src`.

## Testing
Run `npm i --dev`, then your all set for testing! The command does not need to be built to be tested, and instead
can be tested simply with `node ./src/index.js`, with all the cli args you intend to use for the test coming just
after. The executable i have been using for testing the emulator is `./test-bench/bad-apple.rxe`. Though you can
use anything you like.

To make new executables, you can either install the [LEGO MINDSTORMS Education NXT](<https://education.lego.com/en-us/downloads/retiredproducts/nxt/software/>)
official software, or install one of [NBC](<https://bricxcc.sourceforge.net/nbc/>)/[BricxCC](<https://bricxcc.sourceforge.net/>). (If you can not get
access to any of these, i can also supply the installers for them). 

To test the website, run `npm run test`, then open a browser tab to `http://localhost:8080`. 