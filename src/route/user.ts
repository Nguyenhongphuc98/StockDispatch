
import { restrict } from "../account/auth";
import { authorizeAdmin, authorizeModifyAccount, createAccount, listAccounts, resetPassword, updateAccount } from "../account/modify";
import { decryptBody } from "../secure/aes";

export function user(app: any) {
    app.post('/api/v1/user', restrict, authorizeModifyAccount, decryptBody, createAccount);
    app.put('/api/v1/user/:id', restrict, authorizeModifyAccount, decryptBody, updateAccount);
    app.get('/api/v1/user', restrict, authorizeModifyAccount, listAccounts);
    app.get('/api/v1/admin/reset/:id', restrict, authorizeAdmin, resetPassword);
}
