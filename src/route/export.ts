
import { defaultHandler } from "../utils/response";
import {onExportItem} from "../scanner";

export function doExport(app) {
    app.put("/api/v1/mobile/export/:id", onExportItem);
    app.get("/api/v1/export", defaultHandler);
    app.get("/api/v1/export/:id", defaultHandler);
}

