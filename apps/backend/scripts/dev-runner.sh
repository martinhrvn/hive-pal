#!/bin/sh
npx tsc-esm-fix --target dist 2>/dev/null
exec node "$@"
