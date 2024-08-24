import {
  InvalidPayloadResponse,
  ResourceNotFoundResponse,
  SuccessResponse,
} from "../utils/response";
import Logger from "../loger";
import { JsonRequest } from "../utils/type";
import { PackingListEntity } from "../persistense/packing-list";

import { commonParams } from "../utils/common-params";
import { ExportEntity } from "../persistense/export";

const TAG = "[Report]";

export async function getExportDetailByINV(
  req: JsonRequest,
  res: any,
  next: any
) {
  const { sessionId } = commonParams(req);
  const user = req.user;
  const { inv } = req.params;

  Logger.log(TAG, "getExportDetailByINV", sessionId, user.username, inv);

  const pkls = await PackingListEntity.getByInvWithExport(inv);

  if (!pkls) {
    Logger.log(TAG, "getExportDetailByINV not found");
    return res.send(new ResourceNotFoundResponse(sessionId));
  }

  return res.send(new SuccessResponse(sessionId, pkls));
}

export async function getExportDetailByPO(
  req: JsonRequest,
  res: any,
  next: any
) {
  const { sessionId, fromDate, toDate } = commonParams(req);
  const user = req.user;
  const { po } = req.params;

  Logger.log(
    TAG,
    "getExportDetailByPO",
    sessionId,
    user.username,
    po,
    fromDate,
    toDate
  );

  if (!po || !fromDate || !toDate) {
    return res.send(new InvalidPayloadResponse(sessionId));
  }

  const pkls = await PackingListEntity.getPackingListsByPoAndDateRange(
    po,
    new Date(Number(fromDate)),
    new Date(Number(toDate))
  );

  if (!pkls) {
    Logger.log(TAG, "getExportDetailByPO not found");
    return res.send(new ResourceNotFoundResponse(sessionId));
  }

  return res.send(new SuccessResponse(sessionId, pkls));
}

export async function getExportDetailByPackageId(
  req: JsonRequest,
  res: any,
  next: any
) {
  const { sessionId, fromDate, toDate } = commonParams(req);
  const user = req.user;
  const { pid } = req.params;

  Logger.log(TAG, "getExportDetailByPackageId", sessionId, user.username, pid);

  const pkls = await PackingListEntity.getPackingListsByPackgeIdAndDateRange(
    pid,
    new Date(Number(fromDate)),
    new Date(Number(toDate))
  );

  if (!pkls) {
    Logger.log(TAG, "getExportDetailByPackageId not found");
    return res.send(new ResourceNotFoundResponse(sessionId));
  }

  return res.send(new SuccessResponse(sessionId, pkls));
}

export async function getExportDetailByExportTime(
  req: JsonRequest,
  res: any,
  next: any
) {
  const { sessionId, fromDate, toDate } = commonParams(req);
  const user = req.user;

  Logger.log(TAG, "getExportDetailByExportTime", sessionId, user.username);

  const pkls = await PackingListEntity.getPackingListsByExportCreateDate(
    new Date(Number(fromDate)),
    new Date(Number(toDate))
  );

  if (!pkls) {
    Logger.log(TAG, "getExportDetailByExportTime not found");
    return res.send(new ResourceNotFoundResponse(sessionId));
  }

  return res.send(new SuccessResponse(sessionId, pkls));
}

export async function getExportDetailByCustomer(
  req: JsonRequest,
  res: any,
  next: any
) {
  const { sessionId, fromDate, toDate } = commonParams(req);
  const user = req.user;
  const { customer } = req.params;

  Logger.log(TAG, "getExportDetailByCustomer", sessionId, user.username);
  debugger;
  const pkls = await PackingListEntity.getPackingListsByExportCustomer(
    customer,
    new Date(Number(fromDate)),
    new Date(Number(toDate))
  );

  if (!pkls) {
    Logger.log(TAG, "getExportDetailByCustomer not found");
    return res.send(new ResourceNotFoundResponse(sessionId));
  }

  return res.send(new SuccessResponse(sessionId, pkls));
}

export async function getReportOverview(req: JsonRequest, res: any, next: any) {
  const { sessionId } = commonParams(req);
  const user = req.user;

  Logger.log(TAG, "getReportOverview", sessionId, user.username);

  const exportCount = await ExportEntity.count();
  const pklCount = await PackingListEntity.count();

  return res.send(
    new SuccessResponse(sessionId, {
      exportCount,
      pklCount,
    })
  );
}
