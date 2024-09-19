

import { restrict } from "../account/auth";
import { getSubItems } from "../middleware/sub-item";
import { endWeigh, getWeigh, startWeigh, updateWeigh } from "../middleware/weigh";
import { decryptBody } from "../secure/aes";
import { validateRequest } from "../secure/request-manager";
import { defaultHandler } from "../utils/response";
import { withErrorHandling } from "../utils/safe";

export function weigh(app) {
    // app.put("/api/v1/sitem/:id", defaultHandler);
    app.get("/api/v1/sitem", restrict, withErrorHandling(getSubItems));

    app.post("/api/v1/sweigh", restrict, decryptBody, withErrorHandling(startWeigh));
    app.post("/api/v1/eweigh", restrict, decryptBody, withErrorHandling(endWeigh));
    app.get("/api/v1/weigh/:pklid", restrict, withErrorHandling(getWeigh));
    app.post("/api/v1/weigh/:pklid", restrict, decryptBody, validateRequest, withErrorHandling(updateWeigh));
}

