FROM node:current-slim

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

RUN npm install -g knex

COPY . .

RUN npm run build

CMD ["node", "build/index.js"]
