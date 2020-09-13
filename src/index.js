/*
 * 借助阿里云 DNS 服务实现 DDNS（动态域名解析）
 */
const publicIp = require('public-ip');
const Core = require('@alicloud/pop-core');
const isDocker = require('is-docker');
const network = require('./net')

let AccessKey = null;
let AccessKeySecret = null;
let Domain = null;

if (isDocker()) {
  AccessKey = process.env.AccessKey
  AccessKeySecret = process.env.AccessKeySecret
  Domain = process.env.Domain && process.env.Domain.split(',')
} else {
  const config = require('../config.json');
  AccessKey = config.AccessKey
  AccessKeySecret = config.AccessKeySecret
  Domain = config.Domain
}

if (!AccessKey || !AccessKeySecret || !Domain) {
  console.log('配置错误')
  return process.exit(0)
}

const HttpInstance = new Core({
  accessKeyId: AccessKey,
  accessKeySecret: AccessKeySecret,
  endpoint: 'https://alidns.aliyuncs.com',
  apiVersion: '2015-01-09'
});

async function handleOneDomain(domain, externalIp) {
  const { subDomain, mainDomain } = parseDomain(domain)
  const domainRecords = await getDomainRecords(subDomain, mainDomain)

  // 无记录 直接添加
  if (!domainRecords.length) {
    console.log(getTime(), domain, '记录不存在，新增中 ...');
    await addRecord(subDomain, mainDomain, externalIp);
    console.log(getTime(), domain, '新增成功, 当前 dns 指向: ', externalIp);
    return null
  }

  // 匹配已有记录是否存在
  for (let i = 0; i < domainRecords.length; i++) {
    const item = domainRecords[i]

    if (item.RR === subDomain) {
      // 记录值存在
      const recordID = item.RecordId;
      const recordValue = item.Value;
      if (recordValue === externalIp) {
        // 记录值一致
        console.log(getTime(), domain, '记录一致, 无修改');
      } else {
        // 记录值不一致
        await updateRecord(recordID, subDomain, externalIp)
        console.log(getTime(), domain, '更新成功, 当前 dns 指向: ', externalIp);
      }

      return null
    }
  }

  // 记录值不存在
  console.log(getTime(), domain, '记录不存在，新增中 ...');
  await addRecord(subDomain, mainDomain, externalIp);
  console.log(getTime(), domain, '新增成功, 当前 dns 指向: ', externalIp);
  return null
}

// 新增记录
function addRecord(subDomain, mainDomain, ip) {
  return new Promise((resolve, reject) => {
    HttpInstance.request('AddDomainRecord', {
      DomainName: mainDomain,
      RR: subDomain,
      Type: 'A',
      Value: ip
    }, {
      method: 'POST'
    })
      .then(res => {
        resolve(res);
      })
      .catch(e => {
        reject(e);
      })
  });
}

// 更新记录
function updateRecord(id, subDomain, ip) {
  return new Promise((resolve, reject) => {
    HttpInstance.request('UpdateDomainRecord', {
      RecordId: id,
      RR: subDomain,
      Type: 'A',
      Value: ip
    }, {
      method: 'POST'
    })
      .then(res => {
        resolve(res);
      })
      .catch(e => {
        reject(e);
      })
  });
}

// 格式化域名，获取子域名与主域名
function parseDomain(domain) {
  return {
    subDomain: domain.split('.').slice(0, domain.split('.').length - 2).join('.'),
    mainDomain: domain.split('.').slice(-2).join('.'),
  }
}

// 获取域名解析记录
function getDomainRecords(subDomain, mainDomain) {
  return new Promise((resolve, reject) => {
    HttpInstance.request('DescribeDomainRecords', {
      DomainName: mainDomain,
      PageSize: 100,
      KeyWord: subDomain,
    }, {
      method: 'POST'
    })
      .then(res => {
        resolve(res.DomainRecords.Record);
      })
      .catch(e => {
        reject(e);
      })
  });
}

// 获取本机公网 IP
function getExternalIp() {
  return new Promise((resolve, reject) => {
    Promise.race([publicIp.v4({
      onlyHttps: true,
      timeout: 5000,
    }), publicIp.v6({
      onlyHttps: true,
      timeout: 5000,
    })])
      .then((v4, v6) => {        
        if (v4) return resolve(v4)
        if (v6) return resolve(v6)

        reject(new Error('无法获取公网 '))
      })
      .catch(e => {
        console.log(e)
        reject(e)
      })
  })
}

// 时间
function getTime() {
  const now = new Date();
  const localTime = now.getTime();
  const localOffset = now.getTimezoneOffset() * 60000;
  const utc = localTime + localOffset;
  const offset = 8;
  const calctime = utc + (3600000 * offset);
  const calcDate = new Date(calctime);

  return calcDate.toLocaleString()
}

async function MAIN() {
  const resultDomain = typeof Domain === 'string' ? [Domain] : Domain
  const externalIp = await getExternalIp()

  console.log(getTime(), '当前公网 ip:', externalIp);

  for (let i = 0; i < resultDomain.length; i++) {
    await handleOneDomain(resultDomain[i], externalIp)
  }
}

network.on('online', function () {
  MAIN()
}).on('offline', function () {
  console.log('检测到断网，网络在线后将进行下一次记录更新');
});
