import { ErrorCode } from "./const";
import { Express, Request, Response } from "express";

export class JsonResponse {
    constructor(readonly error_code: ErrorCode, readonly message: string, readonly data: Record<string, any>) {

    }
}

export class UnauthenResponse extends JsonResponse {
    constructor(readonly data: Record<string, any> = {}) {
        super(ErrorCode.InvalidAuth, "Unauthen request", data);
    }
}

export class PermissionDeniedResponse extends JsonResponse {
    constructor(readonly data: Record<string, any> = {}) {
        super(ErrorCode.PermissionDenied, "Permission denied request", data);
    }
}

export class AccountExistsResponse extends JsonResponse {
    constructor(readonly data: Record<string, any> = {}) {
        super(ErrorCode.AccountExists, "Account already exists", data);
    }
}

export class SuccessResponse extends JsonResponse {
    constructor(readonly data: Record<string, any> = {}) {
        super(ErrorCode.Success, "success request", data);
    }
}

export function defaultHandler(req: Request, res: Response) {
    console.log(Date.now(), ": receive req: ", req.method, req.url, req.body)
    res.send(new JsonResponse(ErrorCode.Success, "success", {
        reqAt: Date.now(),
    }));
}
