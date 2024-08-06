

import { restrict } from "../account/auth";
import { startWeigh, getWeigh, getSubItems } from "../product/sub-item";
import { defaultHandler } from "../utils/response";
import { withErrorHandling } from "../utils/safe";

export function weigh(app) {
    app.put("/api/v1/sitem/:id", defaultHandler);
    app.get("/api/v1/sitem", restrict, withErrorHandling(getSubItems));

    app.post("/api/v1/weigh", restrict, withErrorHandling(startWeigh));
    app.get("/api/v1/weigh/:pklid", restrict, withErrorHandling(getWeigh));
}

