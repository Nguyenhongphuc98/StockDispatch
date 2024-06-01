import { ErrorCode } from "./const";

export class ResponseJson {
    constructor(readonly error_code: ErrorCode, readonly data: Record<string, any>) {

    }
}