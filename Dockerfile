FROM node:14-alpine

USER node
WORKDIR /home/node/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080
CMD [ "npm", "start" ]