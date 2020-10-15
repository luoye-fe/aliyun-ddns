const EventEmitter = require('events').EventEmitter;
const ping = require('ping')

const HOST = '223.5.5.5';

const network = new EventEmitter();

network.online = false;

async function main() {
  try {
    let { alive } = await ping.promise.probe(HOST, {
      timeout: 2,
    });

    if (alive && !network.online) {
      network.online = true;
      network.emit('online');
    }

    if (!alive && network.online) {
      network.online = false;
      network.emit('offline');
    }

    setTimeout(main, 1000)
  } catch (e) {
    if (network.online) {
      network.online = false;
      network.emit('offline');
    }

    setTimeout(main, 1000)
  }
}

main()

module.exports = network

/* then just listen for the `online` and `offline` events ...
network.on('online', function () {
  console.log('online!');
}).on('offline', function () {
  console.log('offline!');
});
*/
