
import { defaultHandler } from "../utils/response";
import {onExportItem} from "../scanner";
import { createExport, exportModify, getExport, getExports } from "../product/export";
import { restrict } from "../account/auth";
import { decryptBody } from "../secure/aes";
import { validateRequest } from "../secure/request-manager";
import { withErrorHandling } from "../utils/safe";

export function doExport(app) {
    app.patch("/api/v1/export/:id", withErrorHandling(onExportItem));

    app.post("/api/v1/export", restrict, decryptBody, withErrorHandling(createExport));
    app.get("/api/v1/export", restrict, withErrorHandling(getExports));
    app.get("/api/v1/export/:id", restrict, withErrorHandling(getExport));

    app.post("/api/v1/exportm", restrict, decryptBody, validateRequest, withErrorHandling(exportModify));
}

