const path = require('path');
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');

const app = express();
const oneHour  = 3600000;

// connect to db
mongoose.connect('mongodb://localhost/sgbmi', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false})
    .then(db =>console.log('Db Connected'))
    .catch(err => console.log(err)
);

//importando rutas
const indexRoutes = require('./routes/index');

// settings
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname,'views'));
app.set('view engine','ejs');
app.set('debugMode',true);


//middlewares
app.use(session({secret: 'sgbmiSecret',saveUninitialized: true,resave: true}));
app.use(morgan('dev'));
app.use(express.urlencoded({limit: 999999, extended: true}));
app.use(express.static(__dirname + '/views/static', {maxAge: oneHour }));
app.use(fileUpload({createParentPath: true}));



//routes
app.use('/',indexRoutes);

//starting the server
app.listen(app.get('port'),"127.0.0.1", () =>{
    console.log(`Server on port ${app.get('port')}`);
});
