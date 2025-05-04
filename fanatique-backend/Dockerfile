FROM node:20

RUN mkdir /var/www && mkdir /var/www/fanatique-api
WORKDIR /var/www/fanatique-api/

COPY package.json yarn.lock ./

RUN yarn add @types/express
RUN yarn add resolve-tspaths
RUN yarn add typescript -g
RUN yarn add moment-timezone node-cron morgan @types/morgan
RUN yarn install
COPY . .
# RUN npx hardhat compile
# Bypass TypeScript errors by creating a simple build for production
CMD ["yarn", "dev:test"]