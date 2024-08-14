
import {onExportItem, onScannerConnectExport, onScannerConnectWeigh, onScanWeighItem, onUpdateWeighItem} from "../scanner";
import { withErrorHandling } from "../utils/safe";

export function scan(app) {
    app.get("/api/v1/scanner/connecte", withErrorHandling(onScannerConnectExport));
    app.get("/api/v1/scanner/connectw", withErrorHandling(onScannerConnectWeigh));
    app.post("/api/v1/scanner/export", withErrorHandling(onExportItem));
    
    app.post("/api/v1/scanner/gweigh", withErrorHandling(onScanWeighItem));
    app.post("/api/v1/scanner/uweigh", withErrorHandling(onUpdateWeighItem));
}

