/**
 * Message schema
 */

var mongoose = require('mongoose');

var messageSchema = mongoose.Schema({
    senderId: String,
    createdAt: Date,
    type: String,
    content: Object
});

//To add functionality to Message object
//messageSchema.methods.<method_name> = function(args){...}

var Message = mongoose.model('Message', messageSchema);

module.exports = Message;