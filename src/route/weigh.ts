

import { defaultHandler } from "../utils/response";

export function weigh(app) {
    app.put("/api/v1/mobile/weigh/:id", defaultHandler);
    app.get("/api/v1/weigh", defaultHandler);
    app.get("/api/v1/weigh/:id", defaultHandler);
}

