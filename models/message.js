/**
 * Message schema
 */

var mongoose = require('mongoose');

var messageSchema = new mongoose.Schema({
    senderId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    type: {
        type: String,
        enum: {
            values: ['Text', 'Geo', 'UserLocation', 'Image', 'Sensor', 'Alert'],
            message: 'message type `{VALUE}` is not valid'
        },
        required: true
    },
    content: {
        type: Object,
        required: true
    }
});

//To add functionality to Message object
//messageSchema.methods.<method_name> = function(args){...}

var Message = mongoose.model('Message', messageSchema);

module.exports = Message;