#!/bin/sh

# Roda o jar do splinker e redireciona todo o output para o script node
. /app/env.sh
$(which java) -jar /app/splinker.jar /app/splinker.conf 2>&1 | node /app/save_logs.js
