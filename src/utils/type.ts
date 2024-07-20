import { UserEntity } from "../persistense/users";

export interface JsonRequest extends Request {
    params: Record<string, string>;
    rawBody: Record<string, any>;
    user: UserEntity;
}
