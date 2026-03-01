FROM node:current-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
RUN npm install -g knex
COPY . .
RUN npm run build
CMD ["npm", "run", "start"]