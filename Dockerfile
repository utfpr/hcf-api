FROM node:18.16-alpine AS build

WORKDIR /tmp/app

COPY . .

RUN yarn install --production=false \
  && yarn build


# production image

FROM node:18.16-alpine

EXPOSE 3000

ENTRYPOINT node ./dist/index.js

WORKDIR /home/node/app

COPY package.json yarn.lock ./

RUN yarn install --production

COPY --from=build /tmp/app/dist ./dist
COPY ./public ./public

RUN chown -R node:node .

USER node
