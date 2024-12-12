# Etapa de build
FROM node:18.16-alpine AS build

WORKDIR /tmp/app

COPY . .

RUN yarn install --production=false \
  && yarn build

# Imagem de produção
FROM node:18.16-alpine

# Criar o usuário e grupo 'hcf' com UID e GID 1010
RUN addgroup -g 1003 hcf && adduser -u 1003 -G hcf -s /bin/sh -D hcf

EXPOSE 3000

ENTRYPOINT ["node", "./dist/index.js"]

WORKDIR /home/hcf/app

COPY package.json yarn.lock ./

RUN yarn install --production

COPY --from=build /tmp/app/dist ./dist
COPY ./public ./public

RUN chown -R hcf:hcf .

USER hcf
