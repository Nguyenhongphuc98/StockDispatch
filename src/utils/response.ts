import { ErrorCode } from "./const";
import { Express, Request, Response } from "express";

export class JsonResponse {
    constructor(readonly error_code: ErrorCode, readonly data: Record<string, any>) {

    }
}

export function defaultHandler(req: Request, res: Response) {
    console.log(Date.now(), ": receive req: ", req.method, req.url, req.body)
    res.send(new JsonResponse(ErrorCode.Success, {
        reqAt: Date.now(),
    }));
}
