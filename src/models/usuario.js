const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UsuarioSchema = new Schema({
     nome:    { type: String, required: true}
    ,email:   { type: String, required: true}
    ,usuario: { type: String, required: true}
    ,senha:   { type: String, required: true}
    ,codigoPais: { type: String, required: true}
    ,estado:  { type: String, required: true}
    ,tipo:    { type: String, required: true}
    ,codigoPais: { type: String, required: true, ref: "paises"}
    ,institucao: { type: String }
    ,posicao: { type: String }
    ,interesse: { type: String }
    ,criadoEm   : { type: Date, required: false}
    ,criadoPor  : { type: String, required: false}
    ,ativadoEm : { type: Date, required: false}
    ,ativadoPor: { type: String, required: false}
});

module.exports = mongoose.model('usuario', UsuarioSchema);
