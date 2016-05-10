const EventEmitter = require('events');
const util = require('util');

/**
 * Customized event emitter for our MongoDB "Message" collection events.
 * Intended to be used as a singleton across the server
 * @constructor
 */
function MessageCollectionEmitter() {
    EventEmitter.call(this);
}

util.inherits(MessageCollectionEmitter, EventEmitter);

var messageCollectionEmitterInstance = new MessageCollectionEmitter();

/**
 * Exports a "singleton" instance of MessageCollectionEmitter for cross-server event operations
 * @type {MessageCollectionEmitter}
 */
module.exports = messageCollectionEmitterInstance;