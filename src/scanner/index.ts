import { Express, Request, Response } from "express";
import { JsonResponse, NotEncryptSessionNotFoundResponse, NotEncryptSuccessResponse, SuccessResponse } from "../utils/response";
import { ErrorCode } from "../utils/const";
import ExportManager from "../export/export-manager";
import AppSession from "../account/session";
import socketMamanger from "../socket/socket-manager";
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

export function onExportItem(req: Request, res: Response) {
    const rawData = req.body;
    console.log('onExportItem', rawData);
    
    if (ExportManager.doesSessionExists(rawData.sessionId)) {
         //TODO: update progress to DB
         // get item from db

        socketMamanger.broasdcast("export", {
            itemProps: 'props',
        });
    } else {
        // not found export session
        res.status(403).send(new NotEncryptSessionNotFoundResponse());
    }
    res.send(new NotEncryptSuccessResponse());

}

export function onWeighItem(req: Request, res: Response) {
    console.log('onWeighItem', req.body);
    // const qrId = req.body.qrId;
    res.send(new NotEncryptSuccessResponse());

}

// module.exports = {
//     // connectScanner,
//     onScanSuccess,
//     // parseSecrectKey,
// };
