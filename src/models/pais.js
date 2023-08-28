const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaisSchema = new Schema({
    _id:    { type: String, required: true}
    ,nome:   { type: String, required: true}
});

module.exports = mongoose.model('paises', PaisSchema);
