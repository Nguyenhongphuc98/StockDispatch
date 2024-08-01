import AppSession from "../account/session";
import aeswrapper from "../secure/aes";
import { ErrorCode } from "./const";
import { Express, Request, Response } from "express";
import Logger from "../loger";

export class JsonResponse {
    protected data: Record<string, any>;

    constructor(readonly error_code: ErrorCode, readonly message: string, sessionId: string, data: Record<string, any>) {
        Logger.error("[Resp]", message, data);

        this.data = {};

        if (Object.keys(data).length !== 0) {
            try {
                this.data = aeswrapper.encrypt(sessionId, data)
            } catch(e) {
                console.log("Encrypt to resp err:", data, e);
            };
        }
       
    }
}

export class UnauthenResponse extends JsonResponse {
    constructor(sessionId: string, data: Record<string, any> = {}) {
        super(ErrorCode.InvalidAuth, "Unauthen request", sessionId, data);
    }
}

export class PermissionDeniedResponse extends JsonResponse {
    constructor(sessionId: string, data: Record<string, any> = {}) {
        super(ErrorCode.PermissionDenied, "Permission denied request", sessionId, data);
    }
}

export class AccountExistsResponse extends JsonResponse {
    constructor(sessionId: string, data: Record<string, any> = {}) {
        super(ErrorCode.AccountExists, "Account already exists", sessionId, data);
    }
}

export class AccountNotExistsResponse extends JsonResponse {
    constructor(sessionId: string, data: Record<string, any> = {}) {
        super(ErrorCode.AccountExists, "Account not exists", sessionId, data);
    }
}

export class PasswordMissmatchResponse extends JsonResponse {
    constructor(sessionId: string, data: Record<string, any> = {}) {
        super(ErrorCode.PasswordIncorrect, "Password is incorrect", sessionId, data);
    }
}

export class SuccessResponse extends JsonResponse {
    constructor(sessionId: string, data: Record<string, any> = {}) {
        super(ErrorCode.Success, "success request", sessionId, data);
    }
}

export class ResourceNotFoundResponse extends JsonResponse {
    constructor(sessionId: string, data: Record<string, any> = {}) {
        super(ErrorCode.ResourceNotFound, "Resource not found", sessionId, data);
    }
}

export class ErrorResponse extends JsonResponse {
    constructor(sessionId: string, data: Record<string, any> = {}) {
        super(ErrorCode.Error, "Error", sessionId, data);
    }
}

export class NotEncryptSuccessResponse {
    message = "Request success.";
    error_code = ErrorCode.Success;

    constructor(readonly data: Record<string, any> = {}) {
        Logger.error("[Resp]", this.message, data);
    }
}

export class InvalidPayloadResponse extends JsonResponse {
    constructor(sessionId: string, readonly data: Record<string, any> = {}) {
        super(ErrorCode.InvalidPayload, "Payload invalid.", sessionId, data)
        Logger.error("[Resp]", this.message, data);
    }
}

export class NotEncryptSessionNotFoundResponse {
    message = "No session.";
    error_code = ErrorCode.SessionNotFound;

    constructor(readonly data: Record<string, any> = {}) {
        Logger.error("[Resp]", this.message, data);
    }
}

export function defaultHandler(req: Request, res: Response) {
    console.log(Date.now(), ": receive req: ", req.method, req.url, req.body)
    res.send(new NotEncryptSuccessResponse({
        reqAt: Date.now(),
    }));
}
