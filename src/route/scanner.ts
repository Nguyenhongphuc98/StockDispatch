
import {onExportItem, onScannerConnect} from "../scanner";
import { withErrorHandling } from "../utils/safe";

export function scan(app) {
    app.get("/api/v1/scanner/connect", withErrorHandling(onScannerConnect));
    app.post("/api/v1/scanner/export", withErrorHandling(onExportItem));
}

