import {
  ErrorResponse,
  InvalidPayloadResponse,
  ResourceNotFoundResponse,
  SuccessResponse,
} from "../utils/response";
import Logger from "../loger";
import { JsonRequest } from "../utils/type";
import {
  PackingListEntity,
  WeighStatus,
} from "../persistense/packing-list";
import { FindOptionsWhere, LessThanOrEqual } from "typeorm";
import { MAX_ITEMS_PER_PAGE } from "../config";
import { SubItemEntity } from "../persistense/sub-item";

import { commonParams } from "../utils/common-params";
import subItemController from "../controller/subitem-controller";

const TAG = "[SI]";

export async function getSubItems(req: JsonRequest, res: any, next: any) {
  const { sessionId } = commonParams(req);
  const user = req.user;


  //@ts-ignore
  const pkl = req.query.pkl;

  Logger.log(TAG, "get weighs", sessionId, user.username, pkl);

  // only allow get by pklid
  if (!pkl) {
    res.send(new InvalidPayloadResponse(sessionId, { pkl }));
    return;
  }

  if (!await subItemController.createSubItemsIfNotExists(sessionId, pkl)) {
    res.send(new ErrorResponse(sessionId));
    return;
  }

  const conditions: FindOptionsWhere<SubItemEntity> = {};

  conditions.packingList = {
    id: pkl,
  };

  const weighItems = await SubItemEntity.find({
    where: conditions,
    order: {
      createAt: "DESC",
    },
    take: MAX_ITEMS_PER_PAGE,
  });

  res.send(
    new SuccessResponse(sessionId, {
      weighItems: weighItems,
    })
  );
}

export async function startWeigh(req: JsonRequest, res: any, next: any) {
  const { sessionId } = commonParams(req);

  //@ts-ignore
  const pkl = req.query.pkl;
  Logger.log(TAG, "create weigh", sessionId, pkl);

  const pklEntity = await PackingListEntity.findOneBy({ id: pkl });

  if (!pklEntity) {
    res.send(new ResourceNotFoundResponse(sessionId, { pkl }));
    return;
  }

  try {
    pklEntity.weighStatus = WeighStatus.Weighting;
    await pklEntity.save();

    res.send(new SuccessResponse(sessionId, pklEntity));
    return;
  } catch (error) {
    res.send(new ErrorResponse(sessionId));
    return;
  }
}

export async function getWeigh(req: JsonRequest, res: any, next: any) {
  const { sessionId } = commonParams(req);

  //@ts-ignore
  const ts = req.query.ts;

  const { pklid } = req.params;
  Logger.log(TAG, "getWeigh", sessionId, pklid);

  const pklEntity = await PackingListEntity.getByIdWithCreateBy(pklid);

  if (!pklEntity) {
    res.send(new ResourceNotFoundResponse(sessionId, { pklid }));
    return;
  }

  if (!await subItemController.createSubItemsIfNotExists(sessionId, pklid)) {
    res.send(new ErrorResponse(sessionId));
    return;
  }

  const totalWeighItem = await subItemController.countAll([pklid]);
  const weighedItem = await subItemController.countWeighed([pklid]);

  res.send(
    new SuccessResponse(sessionId, {
      ...pklEntity,
      itemsCount: totalWeighItem,
      weighedCount: weighedItem,
    })
  );
}
