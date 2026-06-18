FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p uploads/originales uploads/con-qr

EXPOSE 3000

CMD ["node", "server.js"]
