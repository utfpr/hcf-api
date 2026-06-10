#!/bin/sh

# Roda o jar do splinker, duplica o output para os logs do Docker e envia para o script de log
# Usamos tee para que a saída também seja registrada nos logs do container
# Caminhos absolutos são necessários pois o cron tem um PATH mínimo
/opt/java/openjdk/bin/java -jar /app/splinker.jar /app/splinker.conf 2>&1 | tee /proc/1/fd/1 | /usr/local/bin/node /app/save_logs.mjs
