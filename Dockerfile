# Etapa de build
FROM node:18.16-alpine AS build

WORKDIR /tmp/app

COPY . .

RUN yarn install --production=false \
  && yarn build

# Imagem de produção
FROM node:18.16-alpine

# Criar o usuário e grupo 'hcf_api' com UID e GID 3000
RUN addgroup -g 3000 hcf_api && adduser -u 3000 -G hcf_api -s /bin/sh -D hcf_api

EXPOSE 3000

ENTRYPOINT ["node", "./dist/index.js"]

WORKDIR /home/hcf_api/app

COPY package.json yarn.lock ./

RUN yarn install --production

COPY --from=build /tmp/app/dist ./dist
COPY ./public ./public
COPY src/reports/assets/fonts/*.ttf /usr/share/fonts/truetype/

RUN chown -R hcf_api:hcf_api .

USER hcf_api
