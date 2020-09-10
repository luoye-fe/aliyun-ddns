ALIYUN-DDNS
===============

借助阿里云解析的 API 实现 DDNS

## 说明

主要功能就是如果本机的外网地址是动态的，定时获取外网地址，发现与 DNS 解析记录不一致时，调用阿里云的 DNS API，自动将域名的解析记录更新为本机最新的外网地址。

比如，家里的电信宽带在路由器上拨号，获取到独立的公网 IP，家里的一台树莓派借助此公网 IP 与外界交互，但是路由器重启或者其他一些网络变更会导致公网 IP 变更，此时需要 DDNS 动态域名解析服务。

## 功能

* 自动监听本地公网 IP 变化，毫秒级更新 DNS 解析记录

* 支持多个域名解析

* 支持多级域名解析

* 支持泛域名解析

* 支持 Docker

* 支持 IPV4/IPV6

## 前提

* 域名在阿里云解析

* NodeJS/Docker

* 部署机器有公网 IP

## 直接部署

* 从阿里云获取 [AccessKey AccessKeySecret](https://ak-console.aliyun.com/#/accesskey)

* 克隆本项目 `git clone https://github.com/luoye-fe/aliyun-ddns.git`

* 安装依赖 `npm install`

* 拷贝一份配置文件 `cp config.json.sample config.json`

* 在 `config.json` 中填入相应字段

* 运行 `npm run start`（进程保活可以使用 `pm2`，如 `pm2 start index.js --name aliyun-ddns`）

* 配置文件说明

  * AccessKey、AccessKeySecret: 阿里云 API 密钥

  * Domain: 需 DDNS 的域名地址，多个域名使用数组即可，如

  ```json
  {
    "AccessKey": "AccessKey",
    "AccessKeySecret": "AccessKeySecret",
    "Domain": "example.com"
  }
  ```

  或

  ```json
  {
    "AccessKey": "AccessKey",
    "AccessKeySecret": "AccessKeySecret",
    "Domain": ["sub.example.com", "*.home.example.com"]
  }
  ```

## Docker 部署

* 从阿里云获取 [AccessKey AccessKeySecret](https://ak-console.aliyun.com/#/accesskey)

* 启动容器

```bash
docker run -d \
  --name=aliyun-ddns \
  --restart=always \
  -e AccessKey=Your_AccessKey \
  -e AccessKeySecret=Your_AccessKeySecret \
  -e Domain="sub.example.com,*.home.example.com" \ # 多个域名用英文逗号连接
  luoyefe/aliyun-ddns
```
