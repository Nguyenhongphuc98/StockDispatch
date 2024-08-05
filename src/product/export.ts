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
import exportManager from "../export/export-manager";
import { commonParams } from "../utils/common-params";
import subItemController from "../controller/subitem-controller";

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

  const packinglists = await PackingListEntity.findBy({ id: In(pklIds) });

  if (packinglists.length < pklIds.length) {
    const invalidIds = pklIds.filter((id) => {
      return !packinglists.includes(id);
    });

    Logger.log(TAG, "create export invalid pklids", invalidIds);
    res.send(new ResourceNotFoundResponse(sessionId, { invalidIds }));
    return;
  }

  const exportItem = new ExportEntity();
  exportItem.init(req.rawBody as ExportModel, user, packinglists);

  const missFields = exportItem.getMissingFields();
  if (missFields.length) {
    Logger.log(TAG, "create export miss field", missFields);
    res.send(new InvalidPayloadResponse(sessionId));
    return;
  }

  for (const pid of pklIds) {
    if (!await subItemController.createSubItemsIfNotExists(sessionId, pid)) {
      res.send(new ErrorResponse(sessionId, {message: 'fail to init sub items'}));
      return;
    }
  }

  for (let i = 0; i < packinglists.length; i++) {
    const p = packinglists[i];
    p.status = PKLStatus.Exporting;
    await p.save();
  }

  await exportItem.save();

  exportManager.startSession(exportItem.id);

  res.send(new SuccessResponse(sessionId, exportItem));
}

export async function getExport(req: JsonRequest, res: any, next: any) {
  const { sessionId } = commonParams(req);
  const { id } = req.params;
  const user = req.user;

  Logger.log(TAG, "get export", sessionId, user.username, id);

  const exportItem = await ExportEntity.getByIdWithCreateByAndItems(id);

  if (exportItem) {
    res.send(new SuccessResponse(sessionId, exportItem));
  } else {
    res.send(new ResourceNotFoundResponse(sessionId));
  }
}

export async function getExports(req: JsonRequest, res: any, next: any) {
  const { sessionId } = commonParams(req);
  const user = req.user;

  //@ts-ignore
  const kw = req.query.kw;
  //@ts-ignore
  const ts = req.query.ts;

   //@ts-ignore
   const status = req.query.stt;

  Logger.log(TAG, "get exports", sessionId, user.username, kw, ts);

  const exports = await ExportEntity.getExports(
    MAX_ITEMS_PER_PAGE,
    ts ? new Date(ts) : undefined,
    kw,
    status
  );

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

  const exportItem = await ExportEntity.findOneBy({ id: eid });

  if (!exportItem) {
    Logger.log(TAG, "Call update for not exists export item", eid);
    res.send(new ResourceNotFoundResponse(sessionId));
    return;
  }

  switch (type) {
    case "exported": {
      exportItem.status = ExportStatus.Exported;
      exportItem
        .save()
        .then(() => {
          exportManager.endSession(exportItem.id);
          res.send(new SuccessResponse(sessionId));
        })
        .catch((e) => {
          Logger.error(TAG, "Call delete pkl err", e);
          res.send(new ErrorResponse(sessionId));
        });
      break;
    }

    default:
      res.status(403).send(new InvalidPayloadResponse(sessionId));
      break;
  }
}
