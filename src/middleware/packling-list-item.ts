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
import { MAX_MED_ITEMS_PER_PAGE } from "../config";
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

  Logger.log(TAG, "create products success");
  res.send(new SuccessResponse(sessionId));
}

export async function getProducts(req: JsonRequest, res: any, next: any) {
  const { sessionId, page, pack, po } = commonParams(req);
  const user = req.user;

  //@ts-ignore
  const pkl = req.query.pkl;

  Logger.log(TAG, "get products", sessionId, user.username, pkl, page, pack, po);

  const data = await PackingListItemEntity.getPackingListItemsByPage(page, MAX_MED_ITEMS_PER_PAGE, pkl, pack, po);

  Logger.log(TAG, "get products success", sessionId, user.username);
  res.send(
    new SuccessResponse(sessionId, data)
  );
}
