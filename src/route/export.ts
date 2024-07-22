
import { defaultHandler } from "../utils/response";
import {onExportItem} from "../scanner";
import { createExport, exportModify, getExport, getExports } from "../product/export";
import { restrict } from "../account/auth";
import { decryptBody } from "../secure/aes";
import { validateRequest } from "../secure/request-manager";

export function doExport(app) {
    app.put("/api/v1/mobile/export/:id", onExportItem);

    app.post("/api/v1/export", restrict, decryptBody, createExport);
    app.get("/api/v1/export", restrict, getExports);
    app.get("/api/v1/export/:id", restrict, getExport);

    app.post("/api/v1/exportm", restrict, decryptBody, validateRequest, exportModify);
}

