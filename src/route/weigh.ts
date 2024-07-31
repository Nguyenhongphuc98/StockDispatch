

import { restrict } from "../account/auth";
import { startWeigh, getWeigh, getSubItems } from "../product/sub-item";
import { defaultHandler } from "../utils/response";

export function weigh(app) {
    app.put("/api/v1/sitem/:id", defaultHandler);
    app.get("/api/v1/sitem", restrict, getSubItems);

    app.post("/api/v1/weigh", restrict, startWeigh);
    app.get("/api/v1/weigh/:pklid", restrict, getWeigh);
}

