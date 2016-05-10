const EventEmitter = require('events');
const util = require('util');

function MessageCollectionEmitter() {
    EventEmitter.call(this);
}

util.inherits(MessageCollectionEmitter, EventEmitter);

var messageCollectionEmitterInstance = new MessageCollectionEmitter();

module.exports = messageCollectionEmitterInstance;