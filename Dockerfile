FROM node:jod-slim AS build

WORKDIR /usr/src/app

COPY package.json yarn.lock tsconfig.json .babelrc ./

RUN yarn install --production=false

COPY ./src/ ./src/

RUN yarn build


FROM node:jod-slim

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


ARG \
  PORT=3000 \
  HCF_API_GID=3000 \
  HCF_API_UID=3000 \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

ENV \
  PORT=$PORT \
  PUPPETEER_SKIP_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=$PUPPETEER_EXECUTABLE_PATH

RUN \
  groupadd \
    --gid $HCF_API_GID \
    hcf_api && \
  useradd --create-home \
    --uid $HCF_API_UID \
    --gid $HCF_API_GID \
    --groups audio,video \
    --shell /usr/sbin/nologin \
    hcf_api

WORKDIR /home/hcf_api/app

COPY package.json yarn.lock ./

RUN yarn install --production && \
  yarn cache clean --force

COPY --from=build /usr/src/app/dist ./dist
COPY ./public ./public
COPY src/reports/assets/fonts/*.ttf /usr/share/fonts/truetype/

RUN chown -R hcf_api:hcf_api /home/hcf_api

USER hcf_api

EXPOSE $PORT

CMD node dist/index.js
