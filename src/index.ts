import { authenticate, restrict } from "./auth/login";


const env = require('dotenv');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');


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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: 'shhhh, very secret'
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



app.post('/api/v1/scanner/connect', authenticate, scanner.connectScanner);

app.post('/api/v1/scanner/submit', restrict, scanner.onScanSuccess);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});