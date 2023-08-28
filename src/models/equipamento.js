const mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;

autoIncrement.initialize(mongoose);

const EquipamentoSchema = new Schema({
    estado: { type: String, required: true}
    ,marca: { type: String, required: true}
    ,modelo: { type: String, required: true}
});

EquipamentoSchema.plugin(autoIncrement.plugin, 'equipamentos');

module.exports = mongoose.model('equipamentos', EquipamentoSchema);
