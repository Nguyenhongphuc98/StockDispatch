import "reflect-metadata";

const env = require("dotenv");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const marked = require("marked");

const http = require("http");

import { start } from "./start";
import { auth } from "./route/auth";
import { user } from "./route/user";
import { pkl } from "./route/pkl";
import { doExport } from "./route/export";
import { weigh } from "./route/weigh";
import { corsOptions } from "./cors";



env.config();
const app = express();
const port = process.env.port;

app.use(cors(corsOptions));

const server = http.createServer(app);



// console.log('aaa', express)


app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());
app.use((req: Request, resp: Response, next: any) => {
  //@ts-ignore
  console.log(new Date().toLocaleString(), ": receive req: ", req.method, req.url, req.body, req.headers.sessionid);
  next();
});

// authen
auth(app);

// user
user(app);

// packing list
pkl(app);

// exporting
doExport(app);

// weighing
weigh(app);

app.get("/", function (req, res) {
  var path = __dirname + "/docs.md";
  fs.readFile(path, "utf8", function (err, data) {
    if (err) {
      console.log(err);
    }
    res.send(marked.parse(data.toString()));
  });
});



start(server);

//git pull https://nguyenhongphuc98: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@github.com/Nguyenhongphuc98/StockDispatch.git
// docker-compose down
//docker-compose up -d

// ssh root@164.90.186.39 1310312240
// restart lai sv khi crash