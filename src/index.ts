import "reflect-metadata";

const env = require('dotenv');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');

import { AppDataSource } from "./persistense/data-src";
import { authenticate, logout, restrict } from "./account/auth";
import { createAccount } from "./account/modify";
// import { handleAddItem, handleGetItems} from './goods/item';

const scanner = require('./scanner/index.ts');
const db = require('./persistense');

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

app.use(cors());
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

app.put('/api/v1/user', createAccount);

app.post('/api/v1/login', authenticate);
app.post('/api/v1/logout', logout);

app.post('/api/v1/scanner/connect', scanner.parseSecrectKey, authenticate, scanner.connectScanner);
app.post('/api/v1/scanner/submit', restrict, scanner.onScanSuccess);

// app.post('/api/v1/item', handleAddItem);
// app.get('/api/v1/items', handleGetItems);

app.get('/', (req: any, res: any) => {
  res.send('ok');
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
    })
