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
import { PackingListEntity, PackingListModel } from "../persistense/packing-list";
import { FindOptionsWhere, LessThanOrEqual, Like } from "typeorm";
import { MAX_ITEMS_PER_PAGE } from "../config";
import {
  PackingListItemEntity,
  PackingListItemModel,
} from "../persistense/packling-list-item";

const TAG = "[Product]";

export async function createProducts(
  req: JsonRequest,
  res: Response,
  next: any
) {
  const sessionId = req.headers["sessionid"];
  const user = req.user;

  Logger.log(TAG, "create products", sessionId, user.username);

  const products: PackingListItemModel[] = req.rawBody.items;
  const pklId: string = req.rawBody.pkl;
  const toSaves: PackingListItemEntity[] = [];

  const pkl = await PackingListEntity.findOneBy({id: pklId});

  if (!pkl) {
    res.send(new ResourceNotFoundResponse(sessionId));
    return;
  }

  for (let i = 0; i < products.length; i++) {
    const item = products[i];
    const entity = new PackingListItemEntity();
    entity.init(item, pkl);
    toSaves.push(entity);
  }

  for (let i = 0; i < toSaves.length; i++) {
    if (!toSaves[i].validate()) {
      res.send(new InvalidPayloadResponse());
      return;
    }
  }

  for (let i = 0; i < toSaves.length; i++) {
    await toSaves[i].save();
  }

  res.send(new SuccessResponse(sessionId));
}

export async function getProducts(req: JsonRequest, res: any, next: any) {
  const sessionId = req.headers["sessionid"];
  const user = req.user;
  //@ts-ignore
  const kw = req.query.kw;
  //@ts-ignore
  const ts = req.query.ts;

  //@ts-ignore
  const pkl = req.query.pkl;

  Logger.log(TAG, "get products", sessionId, user.username,pkl, kw, ts);

  const conditions: FindOptionsWhere<PackingListItemEntity> = {};

  if (pkl) {
    conditions.packingList = {
      id: pkl,
    };
  }

  if (kw) {
    conditions.packageId = Like(`%${kw}%`);
  }

  if (!ts) {
    // conditions.createAt = LessThanOrEqual(new Date());
  } else {
    conditions.createAt = LessThanOrEqual(new Date(ts));
  }

  const pklItems = await PackingListItemEntity.find({
    where: conditions,
    order: {
      createAt: "DESC",
    },
    take: MAX_ITEMS_PER_PAGE,
  });

  res.send(
    new SuccessResponse(sessionId, {
      pklItems: pklItems,
      hasMore: pklItems.length >= MAX_ITEMS_PER_PAGE,
    })
  );
}
