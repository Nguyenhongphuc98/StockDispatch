import { Express, Request, Response } from "express";
import { ResponseJson } from "../utils/response";
import { ErrorCode } from "../utils/const";


const SUBMIT_ENDPOINT = '/api/v1/scanner/submit';

function connectScanner(req: Request, res: Response) {
    console.log('connected', req.body.key);
    
    res.send(new ResponseJson(ErrorCode.Success, {
        message: 'Connect success!',
        submitEndpoint: `${req.hostname}:${process.env.port}${SUBMIT_ENDPOINT}`,
        hostName: "Packing list 22/5!"
    }));
}

function onScanSuccess(req: Request, res: Response) {
    console.log('onScanSuccess', req.body);
    res.send('receive2');

}

module.exports = {
    connectScanner,
    onScanSuccess
};
