/**
 * Icon schema
 */

var mongoose = require('mongoose');

var iconSchema = new mongoose.Schema({
    displayNameHeb: {
        type: String,
        required: true
    },
    displayNameEng: {
        type: String,
        required:true
    },
    url: {
        type: String,
        required:true
    }
});

var Icon = mongoose.model('Icon', iconSchema);

module.exports = Icon;