

import { getUserInfo, login, logout, requestLogin, restrict } from "../account/auth";
import { createAccount } from "../account/modify";
import { defaultHandler } from "../utils/response";
const scanner = require("../scanner");

export function doExport(app) {
    app.put("/api/v1/mobile/export/:id", scanner.onScanSuccess);
    app.get("/api/v1/export", defaultHandler);
    app.get("/api/v1/export/:id", defaultHandler);
}

