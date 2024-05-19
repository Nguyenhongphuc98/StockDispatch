const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.port;

const corsOptions = {
  "origin": "*",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": false,
  "optionsSuccessStatus": 204
}

app.use(cors());


app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/', (req, res) => {
  console.log('haha', req.body);
  res.send('receive');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});