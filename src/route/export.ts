
import { createExport, exportModify, getExport, getExports } from "../middleware/export";
import { restrict } from "../account/auth";
import { decryptBody } from "../secure/aes";
import { validateRequest } from "../secure/request-manager";
import { withErrorHandling } from "../utils/safe";

export function doExport(app) {
    app.post("/api/v1/export", restrict, decryptBody, validateRequest, withErrorHandling(createExport));
    app.get("/api/v1/export", restrict, withErrorHandling(getExports));
    app.get("/api/v1/export/:id", restrict, withErrorHandling(getExport));

    app.post("/api/v1/exportm", restrict, decryptBody, validateRequest, withErrorHandling(exportModify));
}

