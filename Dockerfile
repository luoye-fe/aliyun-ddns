FROM node:10.22.0-alpine3.9

WORKDIR /aliyun-ddns

COPY . /aliyun-ddns

RUN mv /aliyun-ddns/config.json.sample /aliyun-ddns/config.json

RUN npm install --registry=https://registry.npm.taobao.org

CMD node ./index.js
