FROM eclipse-temurin:21-jre

ENV SPLINKER_VERSION=7.2.6

WORKDIR /app

RUN \
  apt-get update && \
  apt-get install -y \
    cron \
    tzdata \
    curl && \
  curl -fsSL https://github.com/cria/splinker-javafx/releases/download/v${SPLINKER_VERSION}/splinker.jar \
    -o /app/splinker.jar && \
  apt-get remove -y curl && \
  rm -rf /var/lib/apt/lists/*

ENV TZ=America/Sao_Paulo
ENV CRON_SCHEDULE="0 0 * * *"

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["cron", "-f"]
