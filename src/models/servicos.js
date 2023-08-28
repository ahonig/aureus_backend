const mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;

autoIncrement.initialize(mongoose);

const ServicoSchema = new Schema({
    nome:   { type: String, required: true}
    ,estado: { type: String, required: true}
    ,pais: { type: String, required: true}
    ,cidade: { type: String, required: true}
    ,contato: { type: String, required: true}
    ,tipo: { type: String, required: true}
    ,telefone: { type: String, required: true}
    ,email: { type: String, required: true}
});

ServicoSchema.plugin(autoIncrement.plugin, 'servicos');

module.exports = mongoose.model('servicos', ServicoSchema);
