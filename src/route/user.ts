
import { getUserInfo, login, logout, requestLogin, restrict } from "../account/auth";
import { createAccount } from "../account/modify";
import { defaultHandler } from "../utils/response";

export function user(app) {
    app.post('/api/v1/user', restrict, createAccount);
    app.put('/api/v1/user/:id', defaultHandler);
    app.get('/api/v1/user', defaultHandler);
}

