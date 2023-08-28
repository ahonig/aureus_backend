const mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;

autoIncrement.initialize(mongoose);

const AmostraSchema = new Schema({
    nome:   { type: String, required: true}
    ,grupo: { type: String, required: true}
    ,estado: { type: String, required: true}
});

AmostraSchema.plugin(autoIncrement.plugin, 'amostras' );

module.exports = mongoose.model('amostras', AmostraSchema);
