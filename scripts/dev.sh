#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")

cd "$PROJECT_ROOT" || exit

[ -f 'dev.cert' ] && rm 'dev.cert'
[ -f 'dev.key' ] && rm 'dev.key'

openssl req  -nodes -new -x509  \
    -keyout dev.key \
    -out dev.cert \
    -subj "/C=US/ST=State/L=City/O=company/OU=Com/CN=localhost"

while [ ! -r 'dev.cert' ] || [ ! -r 'dev.key' ]
do
   sleep 1
done

cd "$SCRIPT_DIR" || exit

NODE_ENV=development node --trace-warnings "$PROJECT_ROOT/src/server.js" | pino-pretty
