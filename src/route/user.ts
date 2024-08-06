
import { restrict } from "../account/auth";
import { authorizeAdmin, authorizeModifyAccount, createAccount, listAccounts, adminUpdate, updateAccount } from "../account/modify";
import { decryptBody } from "../secure/aes";
import { validateRequest } from "../secure/request-manager";
import { withErrorHandling } from "../utils/safe";

export function user(app: any) {
    app.post('/api/v1/user', restrict, authorizeModifyAccount, decryptBody, withErrorHandling(createAccount));
    app.put('/api/v1/user/:id', restrict, authorizeModifyAccount, decryptBody, withErrorHandling(updateAccount));
    app.get('/api/v1/user', restrict, authorizeModifyAccount, withErrorHandling(listAccounts));
    app.post('/api/v1/admin', restrict, authorizeAdmin, decryptBody, validateRequest, withErrorHandling(adminUpdate));
}
