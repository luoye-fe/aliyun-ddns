const EventEmitter = require('events').EventEmitter;
const spawn = require('child_process').spawn;
const rl = require('readline');

const RE_SUCCESS = /bytes from/i;
const IP = '223.5.5.5';

const proc = spawn('ping', [IP]);

const rli = rl.createInterface(proc.stdout, proc.stdin);
const network = new EventEmitter();

network.online = false;

let offlineCount = 0

rli.on('line', function (str) {
  if (RE_SUCCESS.test(str)) {
    if (!network.online) {
      network.online = true;
      network.emit('online');
    }
  } else if (network.online) {
    offlineCount += 1

    // ping 五次错误判断为断腕
    if (offlineCount === 5) {
      network.online = false;
      network.emit('offline');
      offlineCount = 0
    }
  }
});

module.exports = network

/* then just listen for the `online` and `offline` events ...
network.on('online', function () {
  console.log('online!');
}).on('offline', function () {
  console.log('offline!');
});
*/
