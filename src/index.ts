import "reflect-metadata";

const env = require('dotenv');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const marked = require('marked');

import { AppDataSource, InitAdmin } from "./persistense/data-src";
import { getUserInfo, login, logout, requestLogin, restrict } from "./account/auth";
import { createAccount } from "./account/modify";
import { defaultHandler } from "./utils/response";
// import { handleAddItem, handleGetItems} from './goods/item';

const scanner = require('./scanner/index.ts');

env.config();
const app = express();
const port = process.env.port;

const origins = ["http://127.0.0.1:5500", "http://127.0.0.1:3000", "http://localhost:3000"];
const corsOptions = {
  "origin": origins,
  "Access-Control-Allow-Credentials": true,
  "credentials": true,
  "Access-Control-Allow-Origin" : origins,
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": false,
  "optionsSuccessStatus": 204,
}

// console.log('aaa', express)

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());


// authen 
app.get('/api/v1/reqlogin', requestLogin);
app.post('/api/v1/login', login);
app.post('/api/v1/logout', restrict, logout);
app.get('/api/v1/authenticate', restrict, getUserInfo);

// user
app.post('/api/v1/user', restrict, createAccount);
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

        /**
         * Create admin account
         */
        InitAdmin();

        app.listen(8080, () => {
          console.log(`Example app listening on port ${8080}`)
        });
    })
    .catch((err) => {
        console.error("Error during Data Source initialization", err)
    });

    //git pull https://nguyenhongphuc98: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@github.com/Nguyenhongphuc98/StockDispatch.git
    // docker-compose down
    //docker-compose up -d 

    // ssh root@164.90.186.39 1310312240
