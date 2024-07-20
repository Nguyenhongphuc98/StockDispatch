import { UserEntity } from "../persistense/users";
import { ErrorCode } from "../utils/const";
import {
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

  if (!pkl.validate()) {
    res.send(new InvalidPayloadResponse());
    return;
  }

  await pkl.save();

  res.send(new SuccessResponse(sessionId));
}

export async function getPackinglist(req: JsonRequest, res: any, next: any) {
  const sessionId = req.headers["sessionid"];
  const { id } = req.params;
  const user = req.user;

  Logger.log(TAG, "get pkl", sessionId, user.username, id);

  const pkl = await PackingListEntity.findOneBy({ id: id });

  if (pkl) {
    res.send(new SuccessResponse(sessionId, pkl.toModel()));
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

  const conditions: FindOptionsWhere<PackingListEntity> = {};

  if (kw) {
    conditions.attachedInvoiceId = Like(`%${kw}%`);
  }

  if (!ts) {
  } else {
    conditions.createAt = LessThanOrEqual(new Date(ts));
  }

  const pkls = await PackingListEntity.find({
    where: conditions,
    order: {
      createAt: "DESC",
    },
    take: MAX_ITEMS_PER_PAGE,
  });

  res.send(
    new SuccessResponse(sessionId, {
      pkls: pkls,
      hasMore: pkls.length >= MAX_ITEMS_PER_PAGE,
    })
  );
}
