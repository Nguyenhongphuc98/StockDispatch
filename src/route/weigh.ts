

import { restrict } from "../account/auth";
import { getWeighs } from "../product/weigh-item";
import { defaultHandler } from "../utils/response";

export function weigh(app) {
    app.put("/api/v1/mobile/weigh/:id", defaultHandler);
    app.get("/api/v1/weigh", restrict, getWeighs);
    app.get("/api/v1/weigh/:id", defaultHandler);
}

