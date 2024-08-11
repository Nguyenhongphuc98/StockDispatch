

import { restrict } from "../account/auth";
import { getSubItems } from "../middleware/sub-item";
import { endWeigh, getWeigh, startWeigh } from "../middleware/weigh";
import { defaultHandler } from "../utils/response";
import { withErrorHandling } from "../utils/safe";

export function weigh(app) {
    app.put("/api/v1/sitem/:id", defaultHandler);
    app.get("/api/v1/sitem", restrict, withErrorHandling(getSubItems));

    app.post("/api/v1/sweigh", restrict, withErrorHandling(startWeigh));
    app.post("/api/v1/eweigh", restrict, withErrorHandling(endWeigh));
    app.get("/api/v1/weigh/:pklid", restrict, withErrorHandling(getWeigh));
}

