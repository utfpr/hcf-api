FROM debian:12-slim

RUN apt-get update && \
  apt-get install -y \
    default-mysql-client \
    cron \
    tzdata && \
  rm -rf /var/lib/apt/lists/*

ENV TZ=America/Sao_Paulo
ENV CRON_SCHEDULE="0 0 * * *"


RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY database-sync.sh entrypoint.sh /

ENTRYPOINT ["/entrypoint.sh"]

CMD ["cron", "-f"]
