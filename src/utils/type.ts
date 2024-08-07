import { UserEntity } from "../persistense/users";
import { ErrorCode } from "./const";

export interface JsonRequest extends Request {
    params: Record<string, string>;
    rawBody: Record<string, any>;
    user: UserEntity;
}

export type DataResult = {
    error_code: ErrorCode,
    data: Record<any, any>,
    message?: string,
}

export type SubmitExportItemModel = {
    subId: string,
    eId: string,
}
