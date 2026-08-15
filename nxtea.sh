# Shims the actual node executable to a cli
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
node $SCRIPT_DIR/src/index.js $@