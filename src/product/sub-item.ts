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
  WeighStatus,
} from "../persistense/packing-list";
import { FindOptionsWhere, LessThanOrEqual, Like, Not } from "typeorm";
import { MAX_ITEMS_PER_PAGE } from "../config";
import {
  PackingListItemEntity,
  PackingListItemModel,
} from "../persistense/packling-list-item";
import { SubItemEntity } from "../persistense/sub-item";
import { bunddleSettings } from "./bundle-setting";

import { AppDataSource } from "../persistense/data-src";
import { commonParams } from "../utils/common-params";

const TAG = "[SI]";

async function createSubItemsIfNotExists(sessionId: string,pkl: string) {
  const created = await SubItemEntity.anyItem(pkl);
  if (!created) {
    try {

      const pklEntity = await PackingListEntity.findOne({
        where: {
          id: pkl
        }
      });


      if (!pklEntity) {
        Logger.log(TAG, "create subItem not found pkl");
        return false
      }

      const pklItemEntities = await PackingListItemEntity.find({
        where: { packingList: { id: '1' } }
      });
      const t = PackingListItemEntity;
      debugger;
      await createSubItems(sessionId, pklEntity, pklItemEntities);
      return true
    } catch (error) {
      Logger.log(TAG, "create subItem err", error);
      return false;
    }
  }

  return true;
}

export async function createSubItems(
  sessionId: string,
  pkl: PackingListEntity,
  pklItems: PackingListItemEntity[]
) {
  Logger.log(
    TAG,
    "createSubItems",
    sessionId,
    pkl.id,
    pklItems.map((v) => v.id)
  );

  const queryRunner = AppDataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const WLIentities = pklItems
      .map((item) => {
        const maxBoxes = bunddleSettings.boxesAmount(item.packageId);
        return SubItemEntity.buildWeighItems(maxBoxes, pkl, item);
      })
      .flat();

    await queryRunner.manager.save(SubItemEntity, WLIentities);
    await queryRunner.commitTransaction();
  } catch (error) {
    Logger.error(
      TAG,
      "createSubItems fail",
      sessionId,
      pklItems[0]?.packingList.id,
      pklItems.map((v) => v.id),
      error
    );
    await queryRunner.release();
    await queryRunner.rollbackTransaction();

    throw error;
  } finally {
    await queryRunner.release();
  }
}

export async function getSubItems(req: JsonRequest, res: any, next: any) {
  const { sessionId } = commonParams(req);
  const user = req.user;

  //@ts-ignore
  const ts = req.query.ts;

  //@ts-ignore
  const pkl = req.query.pkl;

  Logger.log(TAG, "get weighs", sessionId, user.username, pkl, ts);

  // only allow get by pklid
  if (!pkl) {
    res.send(new InvalidPayloadResponse(sessionId, { pkl }));
    return;
  }

  if (!await createSubItemsIfNotExists(sessionId, pkl)) {
    res.send(new ErrorResponse(sessionId));
    return;
  }

  const conditions: FindOptionsWhere<SubItemEntity> = {};

  conditions.packingList = {
    id: pkl,
  };

  if (!ts) {
    // conditions.createAt = LessThanOrEqual(new Date());
  } else {
    conditions.createAt = LessThanOrEqual(new Date(ts));
  }

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
      hasMore: weighItems.length >= MAX_ITEMS_PER_PAGE,
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

  if (!createSubItemsIfNotExists(sessionId, pklid)) {
    res.send(new ErrorResponse(sessionId));
    return;
  }

  const totalWeighItem = await SubItemEntity.countAll([pklid]);
  const weighedItem = await SubItemEntity.countWeighed([pklid]);

  res.send(
    new SuccessResponse(sessionId, {
      ...pklEntity,
      itemsCount: totalWeighItem,
      weighedCount: weighedItem,
    })
  );
}
