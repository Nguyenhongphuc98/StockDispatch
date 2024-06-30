import { Role, User } from "../persistense/users";
import { ErrorCode } from "../utils/const";
import { AccountExistsResponse, JsonResponse, SuccessResponse } from "../utils/response";
import { buildHashedData } from "./utils";
import { Request, Response } from "express";

export async function createAccount(req: Request, res: Response, next: any) {
  const username = req.body.username;
  const password = req.body.password;
  const displayName = req.body.displayName;

  const existed = await User.findOneBy({ username: username });
  if (existed) {
    res.send(new AccountExistsResponse());
    return;
  }

  console.log("create account %s:%s", username, password);

  const user = await  User.newAccount(username, password, displayName, Role.User);

  res.send(new SuccessResponse(user));
}
