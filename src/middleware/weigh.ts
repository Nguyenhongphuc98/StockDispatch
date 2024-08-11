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
    const pkl = req.query.pkl;
    Logger.log(TAG, "create weigh", sessionId, user.username, pkl);
  
    // const pklEntity = await PackingListEntity.findOneBy({ id: pkl });
  
    // if (!pklEntity) {
    //   res.send(new ResourceNotFoundResponse(sessionId, { pkl }));
    //   return;
    // }
  
    // try {
    //   pklEntity.weighStatus = WeighStatus.Weighting;
    //   await pklEntity.save();
  
    //   res.send(new SuccessResponse(sessionId, pklEntity));
    //   return;
    // } catch (error) {
    //   res.send(new ErrorResponse(sessionId));
    //   return;
    // }

    const result = await weighController.startWeighSession(pkl);
    commonResponseHandler(sessionId, result, req, res, next);
  }
  
  export async function endWeigh(req: JsonRequest, res: any, next: any) {
    const { sessionId } = commonParams(req);
    const user = req.user;
  
    //@ts-ignore
    const pkl = req.query.pkl;
    Logger.log(TAG, "end weigh", sessionId, user.username, pkl);

    const result = await weighController.endWeighSession(pkl);
    commonResponseHandler(sessionId, result, req, res, next);
  }

  export async function getWeigh(req: JsonRequest, res: any, next: any) {
    const { sessionId } = commonParams(req);
    const user = req.user;
  
    //@ts-ignore
    const ts = req.query.ts;
  
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