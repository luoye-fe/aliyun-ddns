ALIYUN-DDNS
===============

借助阿里云解析的API实现二级域名DDNS。

别再用花生壳了，域名不能自定义不说，还依赖路由器，所以用 NodeJS 实现了一下。

## 前提

* 域名在阿里云解析

* NodeJS

* 部署机器有外网 IP

## 部署

* 从阿里云获取 [AccessKey AccessKeySecret](https://ak-console.aliyun.com/#/accesskey)

* 克隆本项目 `git clone https://github.com/luoye-fe/aliyun-ddns.git`

* 安装依赖 `npm install`

* 拷贝一份配置文件 `cp config.json.sample config.json`

* 在 `config.json` 中填入相应字段

* 运行 `npm run start`

## 其他

* 服务进程使用 `pm2` 维护，如想开机启动自行配置

* 每五分钟更新一次，如需调整修改 `index.js` 中 `schedule`
