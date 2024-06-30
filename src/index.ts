import "reflect-metadata";

const env = require('dotenv');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const marked = require('marked');

import { AppDataSource } from "./persistense/data-src";
import { authenticate, logout, restrict } from "./account/auth";
import { createAccount } from "./account/modify";
import { defaultHandler } from "./utils/response";
// import { handleAddItem, handleGetItems} from './goods/item';

const scanner = require('./scanner/index.ts');

env.config();
const app = express();
const port = process.env.port;

const corsOptions = {
  "origin": "*",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": false,
  "optionsSuccessStatus": 204
}

// console.log('aaa', express)

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: 'YwBJeI3ShQDdk7m8f_FvQY_aAF3N_v1r'
}));

app.use(function(req: any, res: any, next: any){
  var err = req.session.error;
  var msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  next();
});

// authen
app.post('/api/v1/login', authenticate);
app.post('/api/v1/logout', logout);

// user
app.post('/api/v1/user', createAccount);
app.put('/api/v1/user/:id', defaultHandler);
app.get('/api/v1/user', defaultHandler);

// packing list
app.post('/api/v1/pkl', defaultHandler);
app.put('/api/v1/pkl/:id', defaultHandler);
app.delete('/api/v1/pkl/:id', defaultHandler);
app.get('/api/v1/pkl', defaultHandler);
app.get('/api/v1/pkl/:id', defaultHandler);

app.post('/api/v1/item', defaultHandler);
app.get('/api/v1/item', defaultHandler);

// exporting
app.put('/api/v1/mobile/export/:id', scanner.onScanSuccess);
app.get('/api/v1/export', defaultHandler);
app.get('/api/v1/export/:id', defaultHandler);

// weighing
app.put('/api/v1/mobile/weigh/:id', defaultHandler);
app.get('/api/v1/weigh', defaultHandler);
app.get('/api/v1/weigh/:id', defaultHandler);

app.get('/', function(req, res) {
  var path = __dirname + '/docs.md';
  fs.readFile(path, 'utf8', function(err, data) {
    if(err) {
      console.log(err);
    }
    res.send(marked.parse(data.toString()));
  });
});

app.get('/weigh', (req: any, res: any) => {
  res.send('weigh');
});

app.get('/export', (req: any, res: any) => {
  res.send('export');
});

AppDataSource.initialize()
    .then(async () => {
        console.log("Data Source has been initialized!");
        app.listen(8080, () => {
          console.log(`Example app listening on port ${8080}`)
        });
    })
    .catch((err) => {
        console.error("Error during Data Source initialization", err)
    });

