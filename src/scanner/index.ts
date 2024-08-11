import { Request, Response } from "express";
import {
  NotEncryptSuccessResponse,
} from "../utils/response";
import exportController from "../controller/export-controller";
import Logger from "../loger";
import { rawResponseHandler } from "../utils/common-response";
import { SubmitExportItemModel } from "../utils/type";
import scanController from "./scan-controller";
import weighController from "../controller/weigh-controller";

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
  //@ts-ignore
  const { eid } = req.query;
  const bodyCipher = req.body;

  Logger.log(TAG, "onExportItem", bodyCipher, eid);

  const result = await exportController.exportItem(eid as string, bodyCipher);

  return rawResponseHandler(result, req, res, next);
}

export async function onScanWeighItem(req: Request, res: Response, next: any) {
  //@ts-ignore
  const { wid } = req.query;
  const bodyCipher = req.body;

  Logger.log(TAG, "onWeighItem", bodyCipher, wid);

  const result = await weighController.getWeighItemInfo(wid as string, bodyCipher);

  return rawResponseHandler(result, req, res, next);
}

export async function onUpdateWeighItem(req: Request, res: Response, next: any) {
  //@ts-ignore
  const { wid } = req.query;
  const bodyCipher = req.body;

  Logger.log(TAG, "onUpdateWeighItem", bodyCipher, wid);

  const result = await weighController.updateWeighInfo(wid as string, bodyCipher);

  return rawResponseHandler(result, req, res, next);
}

export async function onScannerConnect(req: Request, res: Response, next: any) {
  const { wid, eid } = req.query;

  Logger.log(TAG, "onScannerConnect", wid, eid);

  const result = await scanController.connect({wid: wid as string, eid: eid as string});

  return rawResponseHandler(result, req, res, next);
}
