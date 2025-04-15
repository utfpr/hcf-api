# Etapa de build
FROM node:jod-alpine AS build

WORKDIR /tmp/app

COPY . .

RUN yarn install --production=false \
  && yarn build


FROM node:jod-alpine

RUN addgroup -g 3000 hcf_api && adduser -u 3000 -G hcf_api -s /bin/sh -D hcf_api

EXPOSE 3000

ENTRYPOINT ["node", "./dist/index.js"]

WORKDIR /home/hcf_api/app

COPY package.json yarn.lock ./

RUN yarn install --production

COPY --from=build /tmp/app/dist ./dist
COPY ./public ./public

RUN chown -R hcf_api:hcf_api .

USER hcf_api
