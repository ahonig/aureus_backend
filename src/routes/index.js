const express = require('express');
const moment = require('moment');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// models
const Usuario        = require('../models/usuario');
const Amostra        = require('../models/amostra');
const Origen         = require('../models/origen');
const MicroOrganismo = require('../models/microorganismo');
const Servico        = require('../models/servicos');
const Equipamento    = require('../models/equipamento');
const Sequencia      = require('../models/sequencia');
const Laboratorio    = require('../models/laboratorio');
const Pais           = require('../models/pais');
const Relatorio      = require('../models/relatorio');

var location = {};
var translation = [];
var langFilePath = path.join(__dirname, '..', 'views', 'static', 'js', 'plugin', 'i18n', 'lang');
fs.readFile(path.join(langFilePath,'en.json'), (err, data) => {
    if (err) throw err;
    translation["us"] = JSON.parse(data);
});

fs.readFile(path.join(langFilePath,'es.json'), (err, data) => {
    if (err) throw err;
    translation["es"] = JSON.parse(data);
});

var lang = "us";
var sess;
var now;

//routes
router.get('/',(req, res) =>{
    location.parent = null;
    location.id = "index";
    res.render('index', {location, lang, translation});
});

// ADMIN
router.get('/admin/', async (req, res) =>{
    res.set('Cache-Control', 'no-store')
    location.parent = null;
    location.id = "inicio";
    sess = req.session;
    console.log("Request session: "+sess.usuario+"/"+sess.tipo);
    console.log("current lang: ", lang);
    if (sess.usuario){
	    var cantidadTotal = 0;
	    var cantidadUsuarios = 0;
	    var ultimaActulizacao = null;
	    if ( sess.tipo == 'OPER'){
                cantidadUsuarios = 1;
		 const humanByMonth = await Sequencia.aggregate(
                                          [
                                            { $match: { $expr: { $and: [{$eq:["$origenId",1]},{$eq:["$craidoPor",sess.usuario]}]}} }
                                          , { $project: {
                                                  mes: { $dateToString: { format: "%m", date: "$criadoEm" } }
                                               , anho: { $dateToString: { format: "%Y", date: "$criadoEm" } }
                                         , anhoActual: { $dateToString: { format: "%Y", date: new Date() } }
                                           }
                                          }
                                          ,{ $match:  { $expr: { $eq: ["$anho", "$anhoActual"]}}}
                                          ,{ $group : {  _id:  { $toInt: "$mes" }, count:{$sum:1}}}
                                        ]
                                        );
                const animalByMonth = await Sequencia.aggregate(
                                          [
                                            { $match: { $expr: { $and: [{$eq:["$origenId",2]},{$eq:["$craidoPor",sess.usuario]}]}} }
                                          , { $project: {
                                                  mes: { $dateToString: { format: "%m", date: "$criadoEm" } }
                                               , anho: { $dateToString: { format: "%Y", date: "$criadoEm" } }
                                         , anhoActual: { $dateToString: { format: "%Y", date: new Date() } }
                                           }
                                          }
                                          ,{ $match:  { $expr: { $eq: ["$anho", "$anhoActual"]}}}
                                          ,{ $group : {  _id:  { $toInt: "$mes" }, count:{$sum:1}}}
                                        ]
                                        );
				const ambientalByMonth = await Sequencia.aggregate(
                                          [
                                            { $match: { $expr: { $and: [{$eq:["$origenId",3]},{$eq:["$craidoPor",sess.usuario]}]}} }
                                          , { $project: {
                                                  mes: { $dateToString: { format: "%m", date: "$criadoEm" } }
                                               , anho: { $dateToString: { format: "%Y", date: "$criadoEm" } }
                                         , anhoActual: { $dateToString: { format: "%Y", date: new Date() } }
                                           }
                                          }
                                          ,{ $match:  { $expr: { $eq: ["$anho", "$anhoActual"]}}}
                                          ,{ $group : {  _id:  { $toInt: "$mes" }, count:{$sum:1}}}
                                        ]
                                       );
                const rankingByGene = await Relatorio.aggregate([
			{ $lookup:
							{
							   from: "sequencias",
							   localField: "sequenciaId",
							   foreignField: "_id",
							   as: "Sequencia"
							}
						},
						{ $unwind: "$Sequencia" },
						{ "$match": { "Sequencia.criadoPor": sess.usuario}},
                        { $project: { _id:0, genes: { $split: [ "$gene", "<br>" ] } } },
                        { $unwind: "$genes" },
                        { "$match": {
                                    "$expr": {
                                       "$ne": [ "$genes", "" ]
                            }
                         }},
                        { "$group": { "_id": "$genes", "quantity": { "$sum": 1 } }},
                        { $sort : { quantity : -1 } },
                        { $limit : 10 }
                ]);

                const rankingBySpecies = await Relatorio.aggregate([
			{ $lookup:
							{
							   from: "sequencias",
							   localField: "sequenciaId",
							   foreignField: "_id",
							   as: "Sequencia"
							}
						},
						{ $unwind: "$Sequencia" },
						{ "$match": { "Sequencia.criadoPor": sess.usuario}},
                        { $match: {"especie":{$ne:null}}},
                        { $group: { _id: "$especie", total: { $sum: 1 } } },  { $sort : {total: -1 }},
                        { $limit : 10 }
                ]);

                const qtyByCountry = await Sequencia.aggregate([
			{ $match: { $expr: { $and: [{$ne:["$codigoPais",null]},{$eq:["$criadoPor",sess.usuario]}]}} },
                        { $group: { _id: "$codigoPais", total: { $sum: 1 } } }
                ]);

                const qtyMlst = await Relatorio.aggregate([
			{ $lookup:
							{
							   from: "sequencias",
							   localField: "sequenciaId",
							   foreignField: "_id",
							   as: "Sequencia"
							}
						},
						{ $unwind: "$Sequencia" },
						{ "$match": { "Sequencia.criadoPor": sess.usuario}},
                        { $match: { $expr: {$eq:[{$isNumber: { $convert: {input: "$mlst", to: "int", onError: "", onNull: ""} }},true]}}},
                        { $group : {_id: { $toInt: "$mlst" }, cantidad:{$sum:1}}},
                        { $sort : { _id : 1 } }
                ]);
		Sequencia.countDocuments({criadoPor: sess.usuario}, function(err, c) {
          		cantidadTotal = c;
			res.render('admin', {sess, location, cantidadTotal, cantidadUsuarios, lang, translation, humanByMonth, animalByMonth, ambientalByMonth, rankingByGene, rankingBySpecies, qtyByCountry, qtyMlst});
      		});
	    } else { 
		const humanByMonth = await Sequencia.aggregate( 
      					  [ 
				            { $match: { origenId : 1} }
 				          , { $project: { 
						  mes: { $dateToString: { format: "%m", date: "$criadoEm" } }
				   	       , anho: { $dateToString: { format: "%Y", date: "$criadoEm" } } 
					 , anhoActual: { $dateToString: { format: "%Y", date: new Date() } } 
					   }
					  }
				          ,{ $match:  { $expr: { $eq: ["$anho", "$anhoActual"]}}}
					  ,{ $group : {  _id:  { $toInt: "$mes" }, count:{$sum:1}}}
        				] 
    					);
		const animalByMonth = await Sequencia.aggregate(
                                          [
                                            { $match: { origenId : 2} }
                                          , { $project: {
                                                  mes: { $dateToString: { format: "%m", date: "$criadoEm" } }
                                               , anho: { $dateToString: { format: "%Y", date: "$criadoEm" } }
                                         , anhoActual: { $dateToString: { format: "%Y", date: new Date() } }
                                           }
                                          }
                                          ,{ $match:  { $expr: { $eq: ["$anho", "$anhoActual"]}}}
                                          ,{ $group : {  _id:  { $toInt: "$mes" }, count:{$sum:1}}}
                                        ]
                                        );
		const ambientalByMonth = await Sequencia.aggregate(
                                          [
                                            { $match: { origenId : 3} }
                                          , { $project: {
                                                  mes: { $dateToString: { format: "%m", date: "$criadoEm" } }
                                               , anho: { $dateToString: { format: "%Y", date: "$criadoEm" } }
                                         , anhoActual: { $dateToString: { format: "%Y", date: new Date() } }
                                           }
                                          }
                                          ,{ $match:  { $expr: { $eq: ["$anho", "$anhoActual"]}}}
                                          ,{ $group : {  _id:  { $toInt: "$mes" }, count:{$sum:1}}}
                                        ]
                                       );
		const rankingByGene = await Relatorio.aggregate([
			{ $project: { _id:0, genes: { $split: [ "$gene", "<br>" ] } } },
			{ $unwind: "$genes" },
			{ "$match": {
                		    "$expr": { 
		                       "$ne": [ "$genes", "" ]
                	    }
			 }},
			{ "$group": { "_id": "$genes", "quantity": { "$sum": 1 } }},
			{ $sort : { quantity : -1 } },
			{ $limit : 10 }
		]);

		const rankingBySpecies = await Relatorio.aggregate([
			{ $match: {"especie":{$ne:null}}},
			{ $group: { _id: "$especie", total: { $sum: 1 } } },  { $sort : {total: -1 }},
			{ $limit : 10 }
		]);

		const qtyByCountry = await Sequencia.aggregate([
			{ $match: {"codigoPais":{$ne:null}}},
                        { $group: { _id: "$codigoPais", total: { $sum: 1 } } }
		]);

		const qtyMlst = await Relatorio.aggregate([
			{ $match: { $expr: {$eq:[{$isNumber: { $convert: {input: "$mlst", to: "int", onError: "", onNull: ""} }},true]}}},
			{ $group : {_id: { $toInt: "$mlst" }, cantidad:{$sum:1}}},
			{ $sort : { _id : 1 } }
		]);

		Usuario.countDocuments({},function(err, c) {
                        cantidadUsuarios = c;
			Sequencia.countDocuments({},function(err, co) {
                   	     cantidadTotal = co;
			     res.render('admin', {sess, location, cantidadTotal, cantidadUsuarios, lang, translation, humanByMonth, animalByMonth, ambientalByMonth, rankingByGene, rankingBySpecies, qtyByCountry, qtyMlst });
                	});
                });
	    }
    } else {
    	res.redirect('/');
    }
});

router.get('/admin/login',(req, res) =>{
    
    location.parent = null;
    location.id = "login";
    res.render('login', {lang});
});

router.get('/admin/logout',(req, res) =>{
    
	req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        sess.usuario = "";
        sess.tipo = "";
        res.render('logout', {lang});
    });
});

router.get('/admin/forgotpassword',(req, res) =>{
    
    res.render('forgotpassword');
});


router.get('/admin/language/:lg', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
	    lang = req.params.lg;
	    console.log("changin Lang to: ", lang);
	    res.redirect('/sgbmi/admin/');
    } else {
        res.redirect('/');
    }
});











/*************************************  
 * Users
 * ***********************************/
 router.get('/admin/users',(req, res) =>{
    res.redirect('/sgbmi/admin/users/list');
});

router.post('/admin/users/list.json', function (req, res) {
    
    var datatablesQuery = require('datatables-query'),
        params = req.body,
        query = datatablesQuery(Usuario);
    query.run(params).then(function (data) {
        res.json(data);
    }, function (err) {
        res.status(500).json(err);
    });
});

router.get('/admin/users/list', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
	location.parent = "security";
    	location.id = "usuarios";
    	res.render('listUsers', {sess, location, lang, translation});
    }
    else {
    	res.redirect('/');
    }
});

router.get('/admin/users/add', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
	location.parent = "security";
    	location.id = "usuarios";
	const paises = await Pais.find({}).select({_id:1, nome:1});
    	res.render('addUser', {sess, paises, location, lang, translation});
    } else {
	res.redirect('/');
    }
});

router.post('/admin/users/add', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){    
    	const usuario = new Usuario(req.body);
	const paises = await Pais.find();
	try {
		usuario.criadoPor = sess.usuario
		usuario.criadoEm = Date.now();
		if ( usuario.estado == "ACTI" ){
        	        usuario.ativadoPor = sess.usuario;
                	usuario.ativadoEm = Date.now();
	        }
		await usuario.save();
	    	res.redirect('/sgbmi/admin/users/list');
    	} catch (err) {
  		//console.log('err' + err);
	  	//res.status(500).send(err);
        	sess = req.session;
	        res.render('addUser', {usuario, paises, sess, err, location, lang, translation});
    	}
    }
});

router.post('/admin/users/register', async (req, res) =>{
   
    try {
	const usuario = new Usuario(req.body);
	
	usuario.estado="PEND";
	usuario.tipo="OPER";
	usuario.criadoPor = usuario.usuario;
        usuario.criadoEm = Date.now();
	usuario.ativadoPor = null;
        usuario.ativadoEm = null;

	await usuario.save();
	try {
	   const { exec } = require("child_process");
	   exec("/bin/sh /root/notificarAdmin.sh", (error, stdout, stderr) => {
   		if (error) {
        		console.log(`error: ${error.message}`);
        		return;
    		}
    		if (stderr) {
        		console.log(`stderr: ${stderr}`);
        		return;
    		}
    		console.log(`status: enviado OK`);
	   });

	} catch (err2) {
		console.log("Nao se pode enviar o mail de notificacao. Detalles "+err2);
	}  
	res.end(JSON.stringify({ estado: "Ok" }));
    } catch ( err ) {
	console.log('err' + err);
	res.status(500).send(err);
    }

});

router.get('/admin/users/edit/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
    	location.parent = "security";
    	location.id = "usuarios";
    	const { id } = req.params;
    	const usuario = await Usuario.findById(id);
    	res.render('editUser', {sess, usuario, location, lang, translation});
    } else {
    	res.redirect('/');
    }
});

router.post('/admin/users/edit/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
	const { id } = req.params;
	const usuarioOld = await Usuario.findById(id);
	if ( req.body.estado == "ACTI" && usuarioOld.estado != "ACTI" ){
    		req.body.ativadoPor = sess.usuario;
		req.body.ativadoEm = Date.now(); 
		//notificar
		try {
           		const { exec } = require("child_process");
	           	exec('/usr/bin/mail -s "Usuario ativo" '+req.body.email+' < /opt/pipeline/userEnabled.template', (error, stdout, stderr) => {
	        	        if (error) {
	                	        console.log(`error: ${error.message}`);
        	                	return;
	        	        }
	                	if (stderr) {
        	                	console.log(`stderr: ${stderr}`);
	                	        return;
		                }
        		        console.log(`status: enviado OK`);
           		});

       		} catch (err2) {
                	console.log("Nao se pode enviar o mail de notificacao. Detalles "+err2);
        	}
		
		
		

	} 
    	await Usuario.update({_id: id}, req.body);
    	res.redirect('/sgbmi/admin/users/list');
    } else {
        res.redirect('/');
    }
});

router.get('/admin/users/delete/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
	location.parent = "security";
    	location.id = "usuarios";
    	const { id } = req.params;
    	const usuario = await Usuario.findById(id);
    	res.render('deleteUser', {sess, usuario, location, lang, translation});
    } else {
    	res.redirect('/');
    }
});

router.post('/admin/users/delete/:id',async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
    	try {
    		const { id } = req.params;
		const usuario = await Usuario.findById(id);
		if ( usuario.usuario != sess.usuario ) {
    			await Usuario.deleteOne({_id: id });
    			res.redirect('/sgbmi/admin/users/list');
		} else {
			res.end(JSON.stringify({ estado: "error", mensaje: "Detalles: No se pode eliminar a si mesmo" }));
		}
	} catch (err){
		res.end(JSON.stringify({ estado: "error", mensaje: "Detalles: "+err }));
	}
    } else {
        res.redirect('/');
    }
});

router.post('/admin/users/login', async (req, res) =>{
    
    var params = req.body;
    const usuario = await Usuario.find( { usuario: params.usuario, senha: params.senha } , function(
	    err,
	    result
    ) {
    	if (err) {
	      console.log(err);
	      res.end(JSON.stringify({ estado: "error", mensaje: "Ha ocurrido un error interno/Internal Error" }));
        } else {
            if ( result[0] && result[0].estado && result[0].estado == 'ACTI' ) {
                sess = req.session;
                sess.usuario = params.usuario;
                sess.tipo = result[0].tipo;
                console.log("Logged as Usuario: "+sess.usuario);
                console.log("             tipo: "+sess.tipo);
                res.end(JSON.stringify({ estado: "Ok", mensaje: "Ok" }));
            } else {
                res.end(JSON.stringify({ estado: "error", mensaje: "Usuario/Contrasena incorrecto. User/Password incorrect." }));
            }
        }
    });
});

/*************************************
 * Samples
 * ***********************************/
 router.get('/admin/samples',(req, res) =>{
    
    res.redirect('/sgbmi/admin/samples/list');
});

router.post('/admin/samples/list.json', function (req, res) {
    
    sess = req.session;
    if (sess.usuario){
		var datatablesQuery = require('datatables-query'),
			params = req.body,
			query = datatablesQuery(Amostra);
	        console.log("params: ",params);
		query.run(params).then(function (data) {
			res.json(data);
		}, function (err) {
			console.log("Error en query.run: ", err);
			res.status(500).json(err);
		});
    } else {
	res.status(500).json({error: "Not authorized"});
    }
});

router.get('/admin/samples/list', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "samples";
        res.render('listSamples', {sess, location, lang, translation});
    }
    else {
        res.redirect('/');
    }
});

router.get('/admin/samples/add',(req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "samples";
        res.render('addSample', {sess, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/samples/add', async (req, res) =>{
    
    const amostra = new Amostra(req.body);
    try {
        await amostra.save();
        res.redirect('/sgbmi/admin/samples/list');
    } catch (err) {
        //console.log('err' + err);
        //res.status(500).send(err);
        sess = req.session;
        res.render('addSample', {amostra, sess, err, location, lang, translation});
    }
});

router.get('/admin/samples/edit/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "samples";
        const { id } = req.params;
        const amostra = await Amostra.findById(id);
        res.render('editSample', {sess, amostra, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/samples/edit/:id', async (req, res) =>{
    
    const { id } = req.params;
    await Amostra.update({_id: id}, req.body);
    res.redirect('/sgbmi/admin/samples/list');
});

router.get('/admin/samples/delete/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "samples";
        const { id } = req.params;
        const amostra = await Amostra.findById(id);
        res.render('deleteSample', {sess, amostra, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/samples/delete/:id',async (req, res) =>{
    
    const { id } = req.params;
    try { 
    	await Amostra.deleteOne({_id: id });
	res.redirect('/sgbmi/admin/samples/list');
    } catch (err) {
	res.redirect('/admin/samples/delete/'+id);
    } 
});

/*************************************
 * Origens
 * ***********************************/
router.get('/admin/origins',(req, res) =>{
    
    res.redirect('/sgbmi/admin/origins/list');
});

router.post('/admin/origins/list.json', function (req, res) {
    
    sess = req.session;
    if (sess.usuario){
		var datatablesQuery = require('datatables-query'),
			params = req.body,
			query = datatablesQuery(Origen);
		query.run(params).then(function (data) {
			res.json(data);
		}, function (err) {
			res.status(500).json(err);
		});
    } else {
	res.status(500).json({error: "Not authorized"});
    }
});

router.get('/admin/origins/list', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "origins";
        res.render('listOrigins', {sess, location, lang, translation});
    }
    else {
        res.redirect('/');
    }
});

router.get('/admin/origins/add',(req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "origins";
        res.render('addOrigin', {sess, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/origins/add', async (req, res) =>{
    
    const origen = new Origen(req.body);
    try {
        await origen.save();
        res.redirect('/sgbmi/admin/origins/list');
    } catch (err) {
        //console.log('err' + err);
        //res.status(500).send(err);
        sess = req.session;
        res.render('addOrigin', {origen, sess, err, location, lang, translation});
    }
});

router.get('/admin/origins/edit/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "origins";
        const { id } = req.params;
        const origen = await Origen.findById(id);
        res.render('editOrigin', {sess, origen, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/origins/edit/:id', async (req, res) =>{
    
    const { id } = req.params;
    await Origen.update({_id: id}, req.body);
    res.redirect('/sgbmi/admin/origins/list');
});

router.get('/admin/origins/delete/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "origins";
        const { id } = req.params;
        const origen = await Origen.findById(id);
        res.render('deleteOrigin', {sess, origen, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/origins/delete/:id',async (req, res) =>{
    
    const { id } = req.params;
    try { 
    	await Origen.deleteOne({_id: id });
		res.redirect('/sgbmi/admin/origins/list');
    } catch (err) {
	res.redirect('/admin/origins/delete/'+id);
    } 
});


/*************************************
 * MicroOrganismos
 * ***********************************/
 router.get('/admin/microorganisms',(req, res) =>{
    res.redirect('/sgbmi/admin/microorganisms/list');
});

router.post('/admin/microorganisms/list.json', function (req, res) {
    
    sess = req.session;
    if (sess.usuario){
		var datatablesQuery = require('datatables-query'),
			params = req.body,
			query = datatablesQuery(MicroOrganismo);
		query.run(params).then(function (data) {
			res.json(data);
		}, function (err) {
			res.status(500).json(err);
		});
    } else {
	    res.status(500).json({error: "Not authorized"});
    }
});

router.get('/admin/microorganisms/list', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "microorganisms";
        res.render('listMicroorganisms', {sess, location, lang, translation});
    }
    else {
        res.redirect('/');
    }
});

router.get('/admin/microorganisms/add',(req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "microorganisms";
        res.render('addMicroorganism', {sess, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/microorganisms/add', async (req, res) =>{
    
    const microOrganismo = new MicroOrganismo(req.body);
    try {
        await microOrganismo.save();
        res.redirect('/sgbmi/admin/microorganisms/list');
    } catch (err) {
        sess = req.session;
        res.render('addMicroorganism', {microOrganismo, sess, err, location, lang, translation});
    }
});

router.get('/admin/microorganisms/edit/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "microorganisms";
        const { id } = req.params;
        const microOrganismo = await MicroOrganismo.findById(id);
        res.render('editMicroorganism', {sess, microOrganismo, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/microorganisms/edit/:id', async (req, res) =>{
    
    const { id } = req.params;
    await MicroOrganismo.updateOne({_id: id}, req.body);
    res.redirect('/sgbmi/admin/microorganisms/list');
});

router.get('/admin/microorganisms/delete/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "microorganisms";
        const { id } = req.params;
        const microOrganismo = await MicroOrganismo.findById(id);
        res.render('deleteMicroorganism', {sess, microOrganismo, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/microorganisms/delete/:id',async (req, res) =>{
    
    const { id } = req.params;
    try { 
    	await MicroOrganismo.deleteOne({_id: id });
		res.redirect('/sgbmi/admin/microorganisms/list');
    } catch (err) {
	res.redirect('/admin/microorganisms/delete/'+id);
    } 
});


/*************************************
 * Servicos
 * ***********************************/
 router.get('/admin/services',(req, res) =>{
    res.redirect('/sgbmi/admin/services/list');
});

router.post('/admin/services/list.json', function (req, res) {
    
    sess = req.session;
    if (sess.usuario){
		var datatablesQuery = require('datatables-query'),
			params = req.body,
			query = datatablesQuery(Servico);
		query.run(params).then(function (data) {
			res.json(data);
		}, function (err) {
			res.status(500).json(err);
		});
    } else {
	res.status(500).json({error: "Not authorized"});
    }
});

router.get('/admin/services/list', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "services";
        res.render('listServices', {sess, location, lang, translation});
    }
    else {
        res.redirect('/');
    }
});

router.get('/admin/services/add',(req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "services";
        res.render('addService', {sess, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/services/add', async (req, res) =>{
    
    const servico = new Servico(req.body);
    try {
        await servico.save();
        res.redirect('/sgbmi/admin/services/list');
    } catch (err) {
        //console.log('err' + err);
        //res.status(500).send(err);
        sess = req.session;
        res.render('addService', {servico, sess, err, location, lang, translation});
    }
});

router.get('/admin/services/edit/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "services";
        const { id } = req.params;
        const servico = await Servico.findById(id);
        res.render('editService', {sess, servico, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/services/edit/:id', async (req, res) =>{
    
    const { id } = req.params;
    await Servico.update({_id: id}, req.body);
    res.redirect('/sgbmi/admin/services/list');
});

router.get('/admin/services/delete/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "samples";
        const { id } = req.params;
        const servico = await Servico.findById(id);
        res.render('deleteService', {sess, servico, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/services/delete/:id',async (req, res) =>{
    
    const { id } = req.params;
    try { 
    	await Servico.deleteOne({_id: id });
		res.redirect('/sgbmi/admin/services/list');
    } catch (err) {
		res.redirect('/admin/services/delete/'+id);
    } 
});

/*************************************
 * Equipamentos
 * ***********************************/
 router.get('/admin/equipments',(req, res) =>{
    
    res.redirect('/sgbmi/admin/equipments/list');
});

router.post('/admin/equipments/list.json', function (req, res) {
    sess = req.session;
    if (sess.usuario){
		var datatablesQuery = require('datatables-query'),
			params = req.body,
			query = datatablesQuery(Equipamento);
		query.run(params).then(function (data) {
			res.json(data);
		}, function (err) {
			res.status(500).json(err);
		});
    } else {
	res.status(500).json({error: "Not authorized"});
    }
});

router.get('/admin/equipments/list', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "equipments";
        res.render('listEquipments', {sess, location, lang, translation});
    }
    else {
        res.redirect('/');
    }
});

router.get('/admin/equipments/add',(req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "equipments";
        res.render('addEquipment', {sess, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/equipments/add', async (req, res) =>{
    const equipamento = new Equipamento(req.body);
    try {
        await equipamento.save();
        res.redirect('/sgbmi/admin/equipments/list');
    } catch (err) {
        //console.log('err' + err);
        //res.status(500).send(err);
        sess = req.session;
        res.render('addEquipment', {equipamento, sess, err, location, lang, translation});
    }
});

router.get('/admin/equipments/edit/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "equipments";
        const { id } = req.params;
        const equipamento = await Equipamento.findById(id);
        res.render('editEquipment', {sess, equipamento, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/equipments/edit/:id', async (req, res) =>{
    const { id } = req.params;
    await Equipamento.update({_id: id}, req.body);
    res.redirect('/sgbmi/admin/equipments/list');
});

router.get('/admin/equipments/delete/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "samples";
        const { id } = req.params;
        const equipamento = await Equipamento.findById(id);
        res.render('deleteEquipment', {sess, equipamento, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/equipments/delete/:id',async (req, res) =>{
    const { id } = req.params;
    try { 
    	await Equipamento.deleteOne({_id: id });
		res.redirect('/sgbmi/admin/equipments/list');
    } catch (err) {
		res.redirect('/admin/equipments/delete/'+id);
    } 
});

/*************************************
 * Laboratorios
 * ***********************************/
router.get('/admin/laboratories',(req, res) =>{
    res.redirect('/sgbmi/admin/laboratories/list');
});

router.post('/admin/laboratories/list.json', function (req, res) {

    sess = req.session;
    if (sess.usuario){
                var datatablesQuery = require('datatables-query'),
                        params = req.body,
                        query = datatablesQuery(Laboratorio);
                query.run(params).then(function (data) {
                        res.json(data);
                }, function (err) {
                        res.status(500).json(err);
                });
    } else {
            res.status(500).json({error: "Not authorized"});
    }
});

router.get('/admin/laboratories/list', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "laboratories";
        res.render('listLaboratories', {sess, location, lang, translation});
    }
    else {
        res.redirect('/');
    }
});

router.get('/admin/laboratories/add',(req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "laboratories";
        res.render('addLaboratory', {sess, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/laboratories/add', async (req, res) =>{

    const laboratorio = new Laboratorio(req.body);
    try {
        await laboratorio.save();
        res.redirect('/sgbmi/admin/laboratories/list');
    } catch (err) {
        sess = req.session;
        res.render('addLaboratory', {laboratorio, sess, err, location, lang, translation});
    }
});

router.get('/admin/laboratories/edit/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "laboratories";
        const { id } = req.params;
        const laboratorio = await Laboratorio.findById(id);
        res.render('editLaboratory', {sess, laboratorio, location, lang, translation});
    } else {
        res.redirect('/');
    }
});


router.post('/admin/laboratories/edit/:id', async (req, res) =>{

    const { id } = req.params;
    await Laboratorio.updateOne({_id: id}, req.body);
    res.redirect('/sgbmi/admin/laboratories/list');
});

router.get('/admin/laboratories/delete/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "configurations";
        location.id = "laboratories";
        const { id } = req.params;
        const laboratorio = await Laboratorio.findById(id);
        res.render('deleteLaboratory', {sess, laboratorio, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/laboratories/delete/:id',async (req, res) =>{

    const { id } = req.params;
    try { 
        await Laboratorio.deleteOne({_id: id });
        res.redirect('/sgbmi/admin/laboratories/list');
    } catch (err) {
        res.redirect('/admin/laboratories/delete/'+id);
    } 
});


/*************************************
 * Sequencias
 * ***********************************/
 router.get('/admin/sequences',(req, res) =>{
    res.redirect('/sgbmi/admin/sequences/list');
});

router.post('/admin/sequences/list.json', function (req, res) {
    sess = req.session;
    if (sess.usuario){
	    	var sequencia = Sequencia.find({})
		    	.populate("origenId")
		    	.populate("mostraId")
		    	.populate("microorganismoIdSuspeito")
	    		.populate("sequenciadorId")
	    		.populate("servicoSaudeId");
		var datatablesQuery = require('datatables-query'),
		params = req.body,
		query = datatablesQuery(sequencia);
            	if ( sess.tipo == "OPER" ) {
                	params.columns[15].searchable=true;
                	params.columns[15].search.value=sess.usuario;
            	}
		query.run(params).then(function (data) {
			if (data.data.length >0 && !data.data[0].dataColecta) {
				data.data[0].dataColecta = null;
			}
			res.json(data);
		}, function (err) {
			res.status(500).json(err);
		});

    } else {
	res.status(500).json({error: "Not authorized"});
    }
});

router.get('/admin/sequences/list', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "sequences";
        location.id = "sequences";
        res.render('listSequences', {sess, location, lang, translation});
    }
    else {
        res.redirect('/');
    }
});

router.get('/admin/sequences/add', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "sequences";
        location.id = "sequences";
	
	/*const amostra = await Amostra.find();
	const equipamento = await Equipamento.find();
	const microOrganismo = await MicroOrganismo.find();
	const servico = await Servico.find();
	const origen = await Origen.find();
	const laboratorio = await Laboratorio.find();
	*/
	const [amostra, equipamento, microOrganismo, servico, origen, laboratorio] = await Promise.all([
		Amostra.find(), Equipamento.find(), MicroOrganismo.find(), Servico.find(), Origen.find(), Laboratorio.find()
	]);
	
	res.render('addSequence', {sess,amostra,equipamento,microOrganismo,servico,origen,laboratorio,location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/sequences/add', async (req, res) =>{
	var body = req.body;
	sess = req.session;
	body.arquivofastqr1= null;
	body.arquivofastqr2= null;
	body.arquivofasta = null;
	body.criadoEm = Date.now();
	body.criadoPor = sess.usuario;
	console.log("Body: ",body);
    const sequencia = new Sequencia(body);
    try {
        await sequencia.save();
        res.redirect('/sgbmi/admin/sequences/list');
    } catch (err) {

	/*
        const amostra = await Amostra.find();
        const equipamento = await Equipamento.find();
        const microOrganismo = await MicroOrganismo.find();
        const servico = await Servico.find();
        const origen = await Origen.find();
	const laboratorio = await Laboratorio.find();
	*/
	const [amostra, equipamento, microOrganismo, servico, origen, laboratorio] = await Promise.all([
                Amostra.find(), Equipamento.find(), MicroOrganismo.find(), Servico.find(), Origen.find(), Laboratorio.find()
        ]);
        sess = req.session;
        res.render('addSequence', {sequencia, amostra,equipamento,microOrganismo,servico,origen,laboratorio, sess, err, location, lang, translation});
    }
});

router.get('/admin/sequences/edit/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "sequences";
        location.id = "sequences";
        const { id } = req.params;
        const sequencia = await Sequencia.findById(id);
	const amostra = await Amostra.find();
        const equipamento = await Equipamento.find();
        const microOrganismo = await MicroOrganismo.find();
        const servico = await Servico.find();
        const origen = await Origen.find();
        const laboratorio = await Laboratorio.find();
        res.render('editSequence', {sess, sequencia, amostra,equipamento,microOrganismo,servico,origen,laboratorio, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/sequences/edit/:id', async (req, res) =>{
    const { id } = req.params;
    await Sequencia.update({_id: id}, req.body);
    res.redirect('/sgbmi/admin/sequences/list');
});

router.get('/admin/sequences/delete/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "sequences";
        location.id = "sequences";
        const { id } = req.params;
        const sequencia = await Sequencia.findById(id);
        res.render('deleteSequence', {sess, sequencia, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/sequences/delete/:id',async (req, res) =>{
    const { id } = req.params;
    try { 
    	await Sequencia.deleteOne({_id: id });
		res.redirect('/sgbmi/admin/sequences/list');
    } catch (err) {
		res.redirect('/admin/sequences/delete/'+id);
    } 
});

router.get('/admin/sequences/upload/:id', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "sequences";
        location.id = "sequences";
        const { id } = req.params;
        const sequencia = await Sequencia.findById(id);
        res.render('uploadSequence', {sess, sequencia, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/sequences/upload/fastqr1/:id', async (req, res) =>{
    const { id } = req.params;
    try {
        if(req.files) {
            //console.log("FastQ R1 File ", req.files);
	    let arquivo = req.files.arquivo;
            const sequencia = await Sequencia.findById(id);
            sequencia.arquivofastqr1 = id+'_R1.fastq.'+( arquivo.mimetype !== undefined && arquivo.mimetype == 'application/gzip' ? 'gz' : 'gz');
            await sequencia.save();
        	arquivo.mv(__dirname + '/../views/uploads/' + sequencia.arquivofastqr1, function(err){
                if (err) {
                    console.log("Err: ",err);
                    res.status(500).send(err);
                    res.end();
                } else {
                    console.log("Uploaded successfully!");
                    res.writeHead(200, {"Content-Type": "text/plain"});
                    res.status(200);
                    res.end();
                }
            });
            
	        
	    }
    } catch (err) {
         console.log("Err: ",err);
         res.status(500).send(err);
    }
});

router.post('/admin/sequences/upload/fastqr2/:id', async (req, res) =>{
    const { id } = req.params;
    try {
        if(req.files) {
            //console.log("FastQ R2 File ", req.files);
            let arquivo = req.files.arquivo;
            const sequencia = await Sequencia.findById(id);
            sequencia.arquivofastqr2 = id+'_R2.fastq.'+( arquivo.mimetype !== undefined && arquivo.mimetype == 'application/gzip' ? 'gz' : 'gz');
            await sequencia.save();
                arquivo.mv(__dirname + '/../views/uploads/' + sequencia.arquivofastqr2, function(err){
                if (err) {
                    console.log("Err: ",err);
                    res.status(500).send(err);
                    res.end();
                } else {
                    console.log("Uploaded successfully!");
                    res.writeHead(200, {"Content-Type": "text/plain"});
                    res.status(200);
                    res.end();
                }
            });


            }
    } catch (err) {
         console.log("Err: ",err);
         res.status(500).send(err);
    }
});


router.post('/admin/sequences/upload/fasta/:id', async (req, res) =>{
    const { id } = req.params;
    try {
        if(req.files) {
            console.log("Fasta File: ", req.files);
            let arquivo = req.files.arquivo;
            const sequencia = await Sequencia.findById(id);
            sequencia.arquivofasta = id+'_fasta'+( arquivo.mimetype !== undefined && arquivo.mimetype == 'application/gzip' ? '.gz' : '');
            await sequencia.save();
                arquivo.mv(__dirname + '/../views/uploads/' + sequencia.arquivofasta, function(err){
                if (err) {
                    console.log("Err: ",err);
                    res.status(500).send(err);
                    res.end();
                } else {
                    console.log("Uploaded successfully!");
                    res.writeHead(200, {"Content-Type": "text/plain"});
                    res.status(200);
                    res.end();
                }
            });


            }
    } catch (err) {
         console.log("Err: ",err);
         res.status(500).send(err);
    }
});

router.get('/admin/sequences/qualityTask/new', async (req, res) =>{
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    if (sess.usuario){
        location.parent = "sequences";
        location.id = "newTask";
	var sequencia;
	if ( sess.tipo == "OPER" ) {
        	sequencia = await Sequencia.find({ criadoPor: sess.usuario }).populate("origenId")
                        .populate("mostraId")
                        .populate("microorganismoIdSuspeito")
                        .populate("sequenciadorId")
                        .populate("servicoSaudeId");
	} else {
		sequencia = await Sequencia.find({}).populate("origenId")
                        .populate("mostraId")
                        .populate("microorganismoIdSuspeito")
                        .populate("sequenciadorId")
                        .populate("servicoSaudeId");
	}
        res.render('newQualityTask', {sess, sequencia, location, lang, translation});
    } else {
        res.redirect('/');
    }
});

router.post('/admin/sequences/qualityTask/new', async (req, res) =>{
    sess = req.session;
    if (sess.usuario){
    	var body = req.body;
	console.log("body: ",body);
	const processedIds = body.sequenciaId;
	const tarefa = body.tarefa;
	location.parent = "sequences";
        location.id = "sequences";
	await Sequencia.updateMany(
				  {_id: { $in: processedIds }},
				  {$set: { ultimaTarefa: tarefa, sequenciadoPor: sess.usuario }}
				);
	res.redirect('/sgbmi/admin/');
    } else {
        res.redirect('/sgbmi/admin/');
    }
});


router.get('/admin/sequences/fastaReport/:id', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    sess = req.session;
    const { id } = req.params;
    if (sess.usuario){
	location.parent = "sequences";
        location.id = "sequences";
	try {
        	var relatorio = await Relatorio.find({ sequenciaId: id });
		res.render('relatorio', {sess, relatorio, location, lang, translation});
	} catch (err) {
		console.log("Err: ",err);
	        res.status(500).send(err);	
	}
    } else {
   	res.redirect('/'); 
    }
});


module.exports = router;
