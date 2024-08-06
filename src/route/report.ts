import { restrict } from "../account/auth";
import { getExportDetailByINV, getExportDetailByCustomer, getExportDetailByPO, getExportDetailByExportTime, getExportDetailByPackageId } from "../product/report";
import { withErrorHandling } from "../utils/safe";

export function report(app) {
  app.get("/api/v1/report/inv/:inv", restrict, withErrorHandling(getExportDetailByINV));
  app.get("/api/v1/report/po/:po", restrict, withErrorHandling(getExportDetailByPO)); // fromDate, toDate
  app.get("/api/v1/report/pid/:pid", restrict, withErrorHandling(getExportDetailByPackageId)); // fromDate, toDate
  app.get("/api/v1/report/ect", restrict, withErrorHandling(getExportDetailByExportTime)); // fromDate, toDate
  app.get("/api/v1/report/customer/:customer", restrict, withErrorHandling(getExportDetailByCustomer)); // fromDate, toDate
}
