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
import Logger from "./loger";



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
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  //@ts-ignore
  Logger.log("[Gateway]", ip, req.method, req.url, req.body, req.headers.sessionid);
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

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1); // Ensure the process exits
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1); // Ensure the process exits
});

// git pull https://nguyenhongphuc98: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@github.com/Nguyenhongphuc98/StockDispatch.git
// docker-compose down
// docker images
// docker image rm
// docker-compose build
// docker-compose up -d
// docker rmi $(docker images -q)


// ssh root@164.90.186.39 1310312240
// restart lai sv khi crash
// add create At req and only allow in 10s timeout,
// if some one replay req -> cache 10s reject, >10s invalid
// logs file

// find / -name "main.db"
// /var/lib/docker/volumes/stockdispatch_database/_data/main.db

// sudo apt-get install sqlite3
//  sqlite3 main.db\
// .tables
// DROP TABLE TableName;