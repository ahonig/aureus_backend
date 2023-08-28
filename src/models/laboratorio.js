const mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;

autoIncrement.initialize(mongoose);

const LaboratorioSchema = new Schema({
     nome:   	  { type: String, required: true}
    ,estado:      { type: String, required: true} 
    ,abreviatura: { type: String, required: true}
});

LaboratorioSchema.plugin(autoIncrement.plugin, 'laboratorios');

module.exports = mongoose.model('laboratorios', LaboratorioSchema);
