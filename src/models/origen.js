const mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;

autoIncrement.initialize(mongoose);

const OrigenSchema = new Schema({
    nome:   { type: String, required: true}
    ,estado: { type: String, required: true}
});

OrigenSchema.plugin(autoIncrement.plugin, 'origens');

module.exports = mongoose.model('origens', OrigenSchema);
