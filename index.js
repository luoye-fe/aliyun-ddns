/*
 * 借助阿里云 DNS 服务实现 DDNS（动态域名解析）
 */
const DNS = require('dns');

const crypto = require('crypto');
const axios = require('axios');
const uuidv1 = require('uuid/v1');

const schedule = require('node-schedule');

const { AccessKey, AccessKeySecret, Domain } = require('./config.json');

const HttpInstance = axios.create({
	baseURL: 'https://alidns.aliyuncs.com/',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36'
    }
});

main();

// 每十五分钟更新一次
schedule.scheduleJob('*/15 * * * *', function() {
	main();
});

async function main() {
	console.log((new Date()).toLocaleString(), '正在更新DNS记录 ...');
	const ip = await getExternalIP();
	console.log((new Date()).toLocaleString(), '当前外网 ip:', ip);
	const records = await getDomainInfo();
	if (!records.length) {
		console.log((new Date()).toLocaleString(), '记录不存在，新增中 ...');
		await addRecord(ip);
		return console.log((new Date()).toLocaleString(), '成功, 当前 dns 指向: ', ip);
	}
	const recordID = records[0].RecordId;
	const recordValue = records[0].Value;
	if (recordValue === ip) return console.log((new Date()).toLocaleString(), '记录一致, 无修改');

	await updateRecord(recordID, ip)
	console.log((new Date()).toLocaleString(), '成功, 当前 dns 指向: ', ip);
}

// 新增记录
function addRecord(ip) {
	return new Promise((resolve, reject) => {
		const requestParams = sortJSON(Object.assign({
			Action: 'AddDomainRecord',
			DomainName: Domain.match(/\.(.*)/)[1],
			RR: Domain.match(/(.*?)\./)[1],
			Type: 'A',
			Value: ip
		}, commonParams()));
		const Signature = sign(requestParams);
		HttpInstance.get('/', {
			params: Object.assign({
				Signature
			}, requestParams)
		})
		.then(res => {
			resolve(res.data);
		})
		.catch(e => {
			reject(e);
		})
	});
}

// 更新记录
function updateRecord(id, ip) {
	return new Promise((resolve, reject) => {
		const requestParams = sortJSON(Object.assign({
			Action: 'UpdateDomainRecord',
			RecordId: id,
			RR: Domain.match(/(.*?)\./)[1],
			Type: 'A',
			Value: ip
		}, commonParams()));
		const Signature = sign(requestParams);
		HttpInstance.get('/', {
			params: Object.assign({
				Signature
			}, requestParams)
		})
		.then(res => {
			resolve(res.data);
		})
		.catch(e => {
			reject(e);
		})
	});
}

// 获取本机外网 ip 地址
async function getExternalIP() {
    const res = await axios.get('http://ifconfig.me/ip', {
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
		const requestParams = sortJSON(Object.assign({
			Action: 'DescribeSubDomainRecords',
			SubDomain: Domain,
			PageSize: 100
		}, commonParams()));
		const Signature = sign(requestParams);
		HttpInstance.get('/', {
			params: Object.assign({
				Signature
			}, requestParams)
		})
		.then(res => {
			resolve(res.data.DomainRecords.Record);
		})
		.catch(e => {
			reject(e);
		})
	});
}

// json 字典顺序排序
function sortJSON(object) {
	const result = {};
	const keys = Object.keys(object);
	keys.sort();
	keys.forEach(item => {
		result[item] = object[item];
	})
	return result;
}

// 阿里云签名
function sign(object) {
	const hmac = crypto.createHmac('sha1', AccessKeySecret + '&');
	const temp = [];
	Object.keys(object).forEach(item => {
		temp.push(`${encodeURIComponent(item)}=${encodeURIComponent(object[item])}`);
	})
	const sourceStr = 'GET&%2F&' + encodeURIComponent(temp.join('&'));
	const result = hmac.update(sourceStr).digest('base64');
	return result;
}

// 阿里云公共请求参数
function commonParams() {
    return {
        Format: 'JSON',
        Version: '2015-01-09',
        AccessKeyId: AccessKey,
        SignatureMethod: 'HMAC-SHA1',
        Timestamp: (new Date()).toISOString(),
        SignatureVersion: '1.0',
        SignatureNonce: uuidv1()
    }
}