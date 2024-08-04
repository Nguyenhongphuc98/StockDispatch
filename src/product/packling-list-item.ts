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
import { commonParams } from "../utils/common-params";

const TAG = "[Product]";

export async function createProducts(
  req: JsonRequest,
  res: Response,
  next: any
) {
  const { sessionId } = commonParams(req);
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
    const missFields = toSaves[i].getMissingFields();
    if (missFields.length) {
      Logger.log(TAG, "create products miss fields", missFields);
      res.send(new InvalidPayloadResponse(sessionId));
      return;
    }
  }

  for (let i = 0; i < toSaves.length; i++) {
    await toSaves[i].save();
  }

  res.send(new SuccessResponse(sessionId));
}

export async function getProducts(req: JsonRequest, res: any, next: any) {
  const { sessionId } = commonParams(req);
  const user = req.user;
  //@ts-ignore
  const kw = req.query.kw;
  //@ts-ignore
  const page = req.query.page || 1;

  //@ts-ignore
  const pkl = req.query.pkl;

  Logger.log(TAG, "get products", sessionId, user.username,pkl, kw, page);

  const data = PackingListItemEntity.getPackingListItemsByPage(page, MAX_ITEMS_PER_PAGE, kw, pkl);

  res.send(
    new SuccessResponse(sessionId, data)
  );
}
