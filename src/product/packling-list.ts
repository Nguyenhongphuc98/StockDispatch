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
} from "../persistense/packing-list";
import { FindOptionsWhere, LessThanOrEqual, Like } from "typeorm";
import { MAX_ITEMS_PER_PAGE } from "../config";
import { PackingListItemEntity } from "../persistense/packling-list-item";

const TAG = "[PKL]";

export async function createPackinglist(
  req: JsonRequest,
  res: Response,
  next: any
) {
  const sessionId = req.headers["sessionid"];
  const user = req.user;

  Logger.log(TAG, "create pkl", sessionId, user.username);

  const pkl = new PackingListEntity();
  pkl.init(req.rawBody as PackingListModel, user);

  const missFields = pkl.getMissingFields();
  if (missFields.length) {
    Logger.log(TAG, "create pkl miss field", missFields);
    res.send(new InvalidPayloadResponse());
    return;
  }

  await pkl.save();

  res.send(new SuccessResponse(sessionId, pkl));
}

export async function getPackinglist(req: JsonRequest, res: any, next: any) {
  const sessionId = req.headers["sessionid"];
  const { id } = req.params;
  const user = req.user;

  Logger.log(TAG, "get pkl", sessionId, user.username, id);

  const pkl = await PackingListEntity.getByIdWithCreateBy(id);

  if (pkl) {
    res.send(new SuccessResponse(sessionId, pkl));
  } else {
    res.send(new ResourceNotFoundResponse(sessionId));
  }
}

export async function getPackinglists(req: JsonRequest, res: any, next: any) {
  const sessionId = req.headers["sessionid"];
  const user = req.user;

  //@ts-ignore
  const kw = req.query.kw;
  //@ts-ignore
  const ts = req.query.ts;

  Logger.log(TAG, "get pkls", sessionId, user.username, kw, ts);

  const pkls = await PackingListEntity.getPackingLists(
    MAX_ITEMS_PER_PAGE,
    ts ? new Date(ts) : undefined,
    kw
  );

  res.send(
    new SuccessResponse(sessionId, {
      pkls: pkls,
      hasMore: pkls.length >= MAX_ITEMS_PER_PAGE,
    })
  );
}

export async function packinglistModify(
  req: JsonRequest,
  res: Response,
  next: any
) {
  const sessionId = req.headers["sessionid"];
  const { pid, reqid, createat, type } = req.rawBody;

  const pkl = await PackingListEntity
    .createQueryBuilder("pl")
    .leftJoinAndSelect("pl.items", "PackingListItem")
    .where("pl.id = :id", { id: pid })
    .getOne();

  if (!pkl) {
    Logger.log(TAG, "Call update for not exists pkl", pid);
    res.send(new ResourceNotFoundResponse(sessionId));
    return;
  }

  switch (type) {
    case "delete": {
      await PackingListItemEntity.remove(pkl.items)
      pkl
        .remove()
        .then(() => {
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
