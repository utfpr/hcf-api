#!/bin/sh

# Roda o jar do splinker e redireciona todo o output para o script TypeScript
. /app/env.sh
$(which java) -jar /app/splinker.jar /app/splinker.conf 2>&1 | npx tsx /app/save_logs.ts
