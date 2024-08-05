import { restrict } from "../account/auth";
import { getExportDetailByINV, getExportDetailByCustomer, getExportDetailByPO, getExportDetailByExportTime, getExportDetailByPackageId } from "../product/report";

export function report(app) {
  app.get("/api/v1/report/inv/:inv", restrict, getExportDetailByINV);
  app.get("/api/v1/report/po/:po", restrict, getExportDetailByPO); // fromDate, toDate
  app.get("/api/v1/report/pid/:pid", restrict, getExportDetailByPackageId); // fromDate, toDate
  app.get("/api/v1/report/ect", restrict, getExportDetailByExportTime); // fromDate, toDate
  app.get("/api/v1/report/customer/:customer", restrict, getExportDetailByCustomer); // fromDate, toDate
}
