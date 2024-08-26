import { UserEntity } from "../persistense/users";
import { ErrorCode } from "../utils/const";
import {
  ErrorResponse,
  InvalidPayloadResponse,
  JsonResponse,
  NotEncryptSuccessResponse,
  PermissionDeniedResponse,
  ResourceNotFoundResponse,
  SuccessResponse,
  UnauthenResponse,
} from "../utils/response";
import { Request, Response } from "express";
import Logger from "../loger";
import { JsonRequest } from "../utils/type";
import {
  PackingListEntity,
  PackingListModel,
  PKLStatus,
} from "../persistense/packing-list";
import { FindOptionsWhere, In, LessThanOrEqual, Like } from "typeorm";
import { MAX_ITEMS_PER_PAGE } from "../config";
import { PackingListItemEntity } from "../persistense/packling-list-item";
import { ExportEntity, ExportModel, ExportStatus } from "../persistense/export";
import exportManager from "../manager/export-manager";
import { commonParams } from "../utils/common-params";
import subItemController from "../controller/subitem-controller";
import exportController from "../controller/export-controller";
import { commonResponseHandler } from "../utils/common-response";

const TAG = "[EXPORT]";

export async function createExport(req: JsonRequest, res: Response, next: any) {
  const { sessionId } = commonParams(req);
  const user = req.user;
  const pklIds = req.rawBody.pklIds;

  Logger.log(TAG, "create export", sessionId, user.username, pklIds);

  if (!pklIds || !Array.isArray(pklIds)) {
    Logger.log(TAG, "create export invalid pklids: not", pklIds);
    res.send(new InvalidPayloadResponse(sessionId));
    return;
  }

  const result = await exportController.startExportSession(
    pklIds,
    req.rawBody as ExportModel,
    user
  );

  commonResponseHandler(sessionId, result, req, res, next);
}

export async function getExport(req: JsonRequest, res: any, next: any) {
  const { sessionId } = commonParams(req);
  const { id } = req.params;
  const user = req.user;

  Logger.log(TAG, "get export", sessionId, user.username, id);

  const exportItem = await exportController.getByIdWithFullData(id);

  if (exportItem) {
    res.send(new SuccessResponse(sessionId, exportItem));
  } else {
    res.send(new ResourceNotFoundResponse(sessionId));
  }
}

export async function getExports(req: JsonRequest, res: any, next: any) {
  const { sessionId, kw, ts } = commonParams(req);
  const user = req.user;

  //@ts-ignore
  const status = req.query.stt;

  Logger.log(TAG, "get exports", sessionId, user.username, kw, ts);

  const exports = await ExportEntity.getExports(
    MAX_ITEMS_PER_PAGE,
    ts ? new Date(Number(ts)) : undefined,
    kw,
    status
  );

  Logger.log(TAG, "get exports success", sessionId, user.username, kw, ts, exports.map(v => v.id));
  res.send(
    new SuccessResponse(sessionId, {
      exports: exports,
      hasMore: exports.length >= MAX_ITEMS_PER_PAGE,
    })
  );
}

export async function exportModify(req: JsonRequest, res: Response, next: any) {
  const { sessionId } = commonParams(req);
  const { eid, reqid, createat, type } = req.rawBody;

  Logger.log(TAG, "exportModify", eid, type);

  if (!eid || !type) {
    res.send(new ErrorResponse(sessionId));
    return;
  }

  switch (type) {
    case "exported": {
      const result = await exportController.endExportSession(eid);
      commonResponseHandler(sessionId, result, req, res, next);
      break;
    }

    default:
      res.status(403).send(new InvalidPayloadResponse(sessionId));
      break;
  }
}
