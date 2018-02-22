ALIYUN-DDNS
===============

借助阿里云解析的API实现二级 DDNS。

## 说明

主要功能就是如果本机的外网地址是动态的，定时获取外网地址，发现与 DNS 解析记录不一致时，调用阿里云的 DNS API，自动将域名的解析记录更新为本机最新的外网地址。

比如，家里的电信宽带在路由器上拨号，获取到独立的公网 IP，家里的一台树莓派借助此公网 IP 与外界交互，但是路由器重启或者其他一些网络变更会导致公网 IP 变更，此时需要 DDNS 动态域名解析服务。

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

* 每十五分钟更新一次，如需调整修改 `index.js` 中 `schedule`

