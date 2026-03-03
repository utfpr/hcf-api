FROM debian:12-slim

RUN \
  apt-get update && \
  apt-get install -y \
    cron \
    tzdata \
    gnupg \
    curl \
    ca-certificates && \

  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql.gpg && \
  echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \

  apt-get update && \
  apt-get install -y \
    postgresql-client-18 && \

  apt-get remove -y \
    curl \
    ca-certificates \
    gnupg && \

  rm -rf /var/lib/apt/lists/*

ENV TZ=America/Sao_Paulo
ENV CRON_SCHEDULE="0 0 * * *"


RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY database-sync.sh entrypoint.sh /

ENTRYPOINT ["/entrypoint.sh"]

CMD ["cron", "-f"]
