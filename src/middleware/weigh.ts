import { commonParams } from "../utils/common-params";
import { JsonRequest } from "../utils/type";
import Logger from "../loger";
import weighController from "../controller/weigh-controller";
import { commonResponseHandler } from "../utils/common-response";
import { PackingListEntity } from "../persistense/packing-list";

const TAG = '[W-MD]';

export async function startWeigh(req: JsonRequest, res: any, next: any) {
    const { sessionId } = commonParams(req);
    const user = req.user;
  
    //@ts-ignore
    const pklid = req.rawBody.pklid;
    Logger.log(TAG, "create weigh", sessionId, user.username, pklid);

    const result = await weighController.startWeighSession(pklid);
    commonResponseHandler(sessionId, result, req, res, next);
  }
  
  export async function endWeigh(req: JsonRequest, res: any, next: any) {
    const { sessionId } = commonParams(req);
    const user = req.user;
  
    //@ts-ignore
    const pklid = req.rawBody.pklid;
    Logger.log(TAG, "end weigh", sessionId, user.username, pklid);

    const result = await weighController.endWeighSession(pklid);
    commonResponseHandler(sessionId, result, req, res, next);
  }

  export async function getWeigh(req: JsonRequest, res: any, next: any) {
    const { sessionId } = commonParams(req);
    const user = req.user;
  
    const { pklid } = req.params;
    Logger.log(TAG, "getWeigh", sessionId, user.username, pklid);
  
    // const pklEntity = await PackingListEntity.getByIdWithCreateBy(pklid);
  
    // if (!pklEntity) {
    //   res.send(new ResourceNotFoundResponse(sessionId, { pklid }));
    //   return;
    // }
  
    // if (!await subItemController.createSubItemsIfNotExists(pklid)) {
    //   res.send(new ErrorResponse(sessionId));
    //   return;
    // }
  
    // const totalWeighItem = await subItemController.countAll([pklid]);
    // const weighedItem = await subItemController.countWeighed([pklid]);
  
    // res.send(
    //   new SuccessResponse(sessionId, {
    //     ...pklEntity,
    //     itemsCount: totalWeighItem,
    //     weighedCount: weighedItem,
    //   })
    // );

    const result = await weighController.getWeighFullInfo(pklid);
    commonResponseHandler(sessionId, result, req, res, next);
  }