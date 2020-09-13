FROM node:10.22.0-alpine3.9

WORKDIR /home/mapp

COPY . /home/mapp

RUN npm install --registry=https://registry.npm.taobao.org

CMD npm run start
