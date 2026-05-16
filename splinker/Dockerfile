FROM eclipse-temurin:21-jre

ARG SPLINKER_VERSION=7.2.7

WORKDIR /app

RUN \
  apt-get update && \
  apt-get install -y \
    cron \
    tzdata \
    curl \
    nodejs \
    npm && \
  curl -fsSL https://github.com/cria/splinker-javafx/releases/download/v${SPLINKER_VERSION}/splinker.jar \
    -o /app/splinker.jar && \
  apt-get remove -y curl && \
  rm -rf /var/lib/apt/lists/*

RUN npm init -y && npm install pg

ENV \
  TZ=America/Sao_Paulo \
  CRON_SCHEDULE="0 0 * * *"

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY save_logs.js /app/save_logs.js
COPY run_splinker.sh /app/run_splinker.sh
RUN chmod +x /app/run_splinker.sh

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["cron", "-f"]
