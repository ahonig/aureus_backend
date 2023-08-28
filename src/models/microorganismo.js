const mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;

autoIncrement.initialize(mongoose);

const MicroOrganismoSchema = new Schema({
     estado: { type: String, required: true}
    ,microorganismo: { type: String, required: true}
    ,especie: { type: String, required: true}
    ,genero: { type: String, required: true}
});

MicroOrganismoSchema.plugin(autoIncrement.plugin, 'microorganismos');

module.exports = mongoose.model('microorganismos', MicroOrganismoSchema);
