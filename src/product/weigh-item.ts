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
import {
  PackingListItemEntity,
  PackingListItemModel,
} from "../persistense/packling-list-item";
import { WeighListItemEntity } from "../persistense/weigh-item";
import { bunddleSettings } from "./bundle-setting";

import { AppDataSource } from "../persistense/data-src";

const TAG = "[WL]";

export async function createWeighItems(
  sessionId: string,
  pkl: PackingListEntity,
  pklItems: PackingListItemEntity[]
) {
  Logger.log(
    TAG,
    "create weigh",
    sessionId,
    pklItems[0]?.packingList.id,
    pklItems.map((v) => v.id)
  );

  const queryRunner = AppDataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const WLIentities = pklItems
      .map((item) => {
        const maxBoxes = bunddleSettings.boxesAmount(item.packageId);
        return WeighListItemEntity.buildWeighItems(maxBoxes, pkl, item);
      })
      .flat();

    await queryRunner.manager.save(WeighListItemEntity, WLIentities);
    await queryRunner.commitTransaction();
  } catch (error) {
    Logger.error(
      TAG,
      "create weigh fail",
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

export async function getWeighs(req: JsonRequest, res: any, next: any) {
  const sessionId = req.headers["sessionid"];
  const user = req.user;

  //@ts-ignore
  const ts = req.query.ts;

  //@ts-ignore
  const pkl = req.query.pkl;

  Logger.log(TAG, "get weighs", sessionId, user.username, pkl, ts);

  // only allow get by pklid
  if (!pkl) {
    res.send(new InvalidPayloadResponse({ pkl }));
  }

  const created = await WeighListItemEntity.anyItem(pkl);
  if (!created) {
    try {
      const pklEntity = await PackingListEntity.findOneBy({ id: pkl });
      const pklItemEntities = await PackingListItemEntity.findBy({
        packingList: pklEntity,
      });
      await createWeighItems(sessionId, pklEntity, pklItemEntities);
    } catch (error) {
      res.send(new ErrorResponse(sessionId));
      return;
    }
  }

  const conditions: FindOptionsWhere<WeighListItemEntity> = {};

  conditions.packingList = {
    id: pkl,
  };

  if (!ts) {
    // conditions.createAt = LessThanOrEqual(new Date());
  } else {
    conditions.createAt = LessThanOrEqual(new Date(ts));
  }

  const weighItems = await WeighListItemEntity.find({
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
