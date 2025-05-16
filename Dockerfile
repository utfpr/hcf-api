FROM node:jod-slim AS build

WORKDIR /usr/src/app

COPY . .

RUN yarn install --production=false && \
  yarn build


FROM node:jod-slim

ARG \
  HCF_API_GID=3000 \
  HCF_API_UID=3000 \
  PORT=3000

ENV \
  PORT=$PORT \
  LANG=en_US.UTF-8 \
  PUPPETEER_SKIP_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

EXPOSE $PORT
CMD node dist/index.js

RUN \
  apt-get update && \
  apt-get install --yes \
    curl \
    gpg && \
  mkdir -p /etc/apt/keyrings && \
  curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | \
    gpg --dearmor > /etc/apt/keyrings/google-chrome.gpg && \
  echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > \
    /etc/apt/sources.list.d/google-chrome.list && \
  apt-get update && \
  apt-get install --no-install-recommends --yes \
    google-chrome-stable && \
  apt-get remove --purge --yes \
    curl \
    gpg && \
  apt autoremove --purge --yes && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

RUN \
  groupadd --system \
    --gid $HCF_API_GID \
    hcf_api && \
  useradd --system \
    --uid $HCF_API_UID \
    --gid hcf_api \
    --groups audio,video \
    --shell /usr/sbin/nologin \
    hcf_api && \
  mkdir -p /home/hcf_api/.local && \
  chown -R hcf_api:hcf_api /home/hcf_api/.local

WORKDIR /home/hcf_api/app

COPY package.json yarn.lock ./

RUN yarn install --production && \
  yarn cache clean --force

COPY --from=build /usr/src/app/dist ./dist
COPY ./public ./public
COPY src/reports/assets/fonts/*.ttf /usr/share/fonts/truetype/

RUN chown -R hcf_api:hcf_api /home/hcf_api/app

USER hcf_api
