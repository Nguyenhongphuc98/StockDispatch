import { Express, Request, Response } from "express";
import {
  JsonResponse,
  NotEncryptSessionNotFoundResponse,
  NotEncryptSuccessResponse,
  SuccessResponse,
} from "../utils/response";
import { ErrorCode } from "../utils/const";
import ExportManager from "../export/export-manager";
import AppSession from "../account/session";
import socketMamanger from "../socket/socket-manager";
import exportController from "../controller/export-controller";
import { commonParams } from "../utils/common-params";
import Logger from "../loger";
import { rawResponseHandler } from "../utils/common-response";
import { SubmitExportItemModel } from "../utils/type";
import scanController from "./scan-controller";

const TAG = "[SCANNER]";

// export * from '../persistense/users';

// const SUBMIT_ENDPOINT = '/api/v1/scanner/submit';

// function noiseKey(key: string) {
//     let noised = '';
//     for(let i =0; i < key.length; i++) {
//         noised += (String.fromCharCode(key.charCodeAt(i) + 1));
//     }
//     return noised;
// }

// function denoiseKey(noised: string) {
//     let key = '';
//     for(let i =0; i < noised.length; i++) {
//         key += (String.fromCharCode(noised.charCodeAt(i) - 1));
//     }
//     return key;
// }

// function parseSecrectKey(req: Request, res: Response, next: any) {
//     if (!req.body.key) {
//         next();
//         return;
//     }
//     const key = denoiseKey(req.body.key);
//     const [username, password] = key.split("@"); // should use other key
//     req.body.username = username;
//     req.body.password = password;
//     next();
// }

// function connectScanner(req: Request, res: Response) {
//     console.log('connected', req.body.key);

//     res.send(new ResponseJson(ErrorCode.Success, {
//         submit: `${req.hostname}:${process.env.port}${SUBMIT_ENDPOINT}`,
//         channel: "Cty TNHH LongView VN",
//     }));
// }

export async function onExportItem(req: Request, res: Response, next: any) {
  // TODO: get in body
  const { subid, eid } = req.query;
  const { sessionId } = commonParams(req);

  Logger.log(TAG, "onExportItem", sessionId, subid, eid);

  if (!subid || !eid) {
    const result = {
      error_code: ErrorCode.InvalidPayload,
      data: {},
    };

    return rawResponseHandler(result, req, res, next);
  }

  const result = await exportController.exportItem(sessionId,{
    subId: subid,
    eId: eid,
  } as SubmitExportItemModel);

  return rawResponseHandler(result, req, res, next);
}

export function onWeighItem(req: Request, res: Response) {
  console.log("onWeighItem", req.body);
  // const qrId = req.body.qrId;
  res.send(new NotEncryptSuccessResponse());
}

export async function onScannerConnect(req: Request, res: Response, next: any) {
  const { wid, eid } = req.query;

  Logger.log(TAG, "onScannerConnect", wid, eid);

  const result = await scanController.connect({wid: wid as string, eid: eid as string});

  return rawResponseHandler(result, req, res, next);
}
