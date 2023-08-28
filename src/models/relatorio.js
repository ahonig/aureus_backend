const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RelatorioSchema = new Schema({
    sequenciaId:            { type: Number , required: true, ref: "sequencias" }
    , checkm_1:              { type: String, required: false}
    , checkm_2:              { type: String, required: false}
    , checkm_3:              { type: String, required: false}
    , checkm_4:              { type: String, required: false}
    , sample:              { type: String, required: false}
    , especie:               { type: String, required: false}
    , gene:                  { type: String, required: false}
    , resfinder:             { type: String, required: false}
    , VFDB:                  { type: String, required: false}
    , plasmid:               { type: String, required: false}
    , mlst:                  { type: String, required: false}
    , mutacoes_poli:         { type: String, required: false}
    , mutacoes_outras:       { type: String, required: false} 
    , coverage:              { type: String, required: false}
});

module.exports = mongoose.model('relatorios', RelatorioSchema);
