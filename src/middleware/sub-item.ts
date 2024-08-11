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

  Logger.log(TAG, "get subitems", sessionId, user.username, pkl);

  // only allow get by pklid
  if (!pkl) {
    res.send(new InvalidPayloadResponse(sessionId, { pkl }));
    return;
  }

  if (!await subItemController.createSubItemsIfNotExists(pkl)) {
    res.send(new ErrorResponse(sessionId));
    return;
  }

  const subItems = await subItemController.getSubitemsOfPkl(pkl);

  res.send(
    new SuccessResponse(sessionId, {
      subItems: subItems,
    })
  );
}
