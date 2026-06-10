FROM eclipse-temurin:21-jre

ARG SPLINKER_VERSION=7.2.7
ARG NODE_VERSION=22.20.0

WORKDIR /app

# Install minimal packages, download splinker.jar and Node.js binary
RUN apt-get update && \
  apt-get install -y \
    cron \
    tzdata \
    curl \
    xz-utils \
    ca-certificates && \
  curl -fsSL https://github.com/cria/splinker-javafx/releases/download/v${SPLINKER_VERSION}/splinker.jar \
    -o /app/splinker.jar && \
  curl -fsSL https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz -o /tmp/node.tar.xz && \
  tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 && \
  rm -f /tmp/node.tar.xz && \
  corepack enable && \
  apt-get remove -y curl xz-utils && \
  apt autoremove -y && \
  rm -rf /var/lib/apt/lists/*

# Copy package.json and yarn.lock from splinker/ and install dependencies
COPY package.json yarn.lock /app/
RUN yarn install --production && \
  yarn cache clean --force

ENV \
  TZ=America/Sao_Paulo \
  CRON_SCHEDULE="0 0 * * *"

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY save_logs.mjs run_splinker.sh /app/
RUN chmod +x /app/run_splinker.sh

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["cron", "-f"]
