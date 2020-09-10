/*
 * 借助阿里云 DNS 服务实现 DDNS（动态域名解析）
 */

const axios = require('axios');

const Core = require('@alicloud/pop-core');

const { AccessKey, AccessKeySecret, Domain } = require('/aliyun-ddns/config.json');

const HttpInstance = new Core({
  accessKeyId: AccessKey,
  accessKeySecret: AccessKeySecret,
  endpoint: 'https://alidns.aliyuncs.com',
  apiVersion: '2015-01-09'
});

main();

// 主域名
const mainDomain = Domain.split('.').slice(-2).join('.')

// 子域名
const subDomain = Domain.split('.').slice(0, Domain.split('.').length - 2).join('.')

async function main() {
	const now = new Date();
  const localTime = now.getTime();
  const localOffset = now.getTimezoneOffset() * 60000;
  const utc = localTime + localOffset;
  const offset = 8;
  const calctime = utc + (3600000 * offset);
  const calcDate = new Date(calctime);

  console.log(calcDate.toLocaleString(), '正在更新DNS记录 ...');

  // 获取当前外网 IP 地址
	const ip = await getExternalIP();
  console.log(calcDate.toLocaleString(), '当前外网 ip:', ip);
  
  // 获取目标域名的所有记录值
  const records = await getDomainInfo();
  
  // 无记录 直接添加
	if (!records.length) {
		console.log(calcDate.toLocaleString(), '记录不存在，新增中 ...');
		await addRecord(ip);
		return console.log(calcDate.toLocaleString(), '成功, 当前 dns 指向: ', ip);
  }
  
  // 匹配已有记录是否存在
  for(let i = 0; i < records.length; i++) {
    const item = records[i]

    if (item.RR === subDomain) {
      // 记录值存在
      const recordID = item.RecordId;
	    const recordValue = item.Value;
	    if (recordValue === ip) {
        // 记录值一致
        console.log(calcDate.toLocaleString(), '记录一致, 无修改');
      } else {
        // 记录值不一致
        await updateRecord(recordID, ip)
	      console.log(calcDate.toLocaleString(), '成功, 当前 dns 指向: ', ip);
      }

      return
    }
  }

  // 记录值不存在
  console.log(calcDate.toLocaleString(), '记录不存在，新增中 ...');
  await addRecord(ip);
  return console.log(calcDate.toLocaleString(), '成功, 当前 dns 指向: ', ip);
}

// 新增记录
function addRecord(ip) {
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
function updateRecord(id, ip) {
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

// 获取本机外网 ip 地址
async function getExternalIP() {
    const res = await axios.get('http://icanhazip.com/', {
    	timeout: 10000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36'
        }
    });
    return res.data.replace('\n', '');
}

// 获取当前解析记录
function getDomainInfo() {
	return new Promise((resolve, reject) => {
    HttpInstance.request('DescribeDomainRecords', {
			DomainName: mainDomain, // 获取 主域名 的记录信息
			PageSize: 100
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
