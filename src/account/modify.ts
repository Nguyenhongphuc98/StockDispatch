import { Role, User } from "../persistense/users";
import { ErrorCode } from "../utils/const";
import {
  AccountExistsResponse,
  AccountNotExistsResponse,
  JsonResponse,
  PermissionDeniedResponse,
  SuccessResponse,
} from "../utils/response";
import { JsonRequest } from "../utils/type";
import { buildHashedData } from "./utils";
import { Request, Response } from "express";
import Logger from "../loger";
import AppSession from "./session";

const TAG = `[User][Modify]`;

export async function authorizeModifyAccount(
  req: JsonRequest,
  res: Response,
  next: any
) {
  const sessionId = req.headers["sessionid"];
  const user = AppSession.getActiveUser(sessionId);
  const { id } = req.params;

  if (id) {
    if (id == user.id) {
      Logger.log(TAG, "Authorize user success.", sessionId);
      next();
    } else {
      Logger.log(TAG, "Authorize user fail.", sessionId);
      res.status(403).send(new PermissionDeniedResponse(sessionId));
    }
    return;
  }

  if (user.role == Role.Admin) {
    Logger.log(TAG, "Authorize admin success.", sessionId);
    next();
    return;
  } else {
    Logger.log(TAG, "Authorize admin fail.", sessionId);
    res.status(403).send(new PermissionDeniedResponse(sessionId));
  }
}

export async function createAccount(
  req: JsonRequest,
  res: Response,
  next: any
) {
  const sessionId = req.headers["sessionid"];

  const username = req.rawBody.username;
  const password = req.rawBody.password;
  const displayName = req.rawBody.displayName;

  const existsUser = await User.findOneBy({ username: username });
  Logger.log(TAG, "Create account", username, password, !existsUser);

  if (existsUser) {
    res.send(new AccountExistsResponse(sessionId));
    next();
    return;
  }

  const user = await User.newAccount(
    username,
    password,
    displayName,
    Role.User
  );

  res.send(new SuccessResponse(sessionId, user));
  next();
}

export async function updateAccount(
  req: JsonRequest,
  res: Response,
  next: any
) {
  const sessionId = req.headers["sessionid"];
  const { id } = req.params;

  const password = req.rawBody.password;
  const displayName = req.rawBody.displayName;
  console.log('aaa', req.rawBody);

  const user = await User.findOneBy({ id: id });

  Logger.log(TAG, "Update account", user?.username, password, user?.displayName ,"=>", displayName);

  if (!user) {
    
    res.send(new AccountNotExistsResponse(sessionId));
    return;
  }

  if (password) {
    await user.updatePassword(password);
  }

  if (displayName) {
    await user.updateDisplayName(displayName);
  }

  res.send(new SuccessResponse(sessionId, user));
}

export async function listAccounts(
  req: JsonRequest,
  res: Response,
  next: any
) {
  const sessionId = req.headers["sessionid"];

  const users = (await User.find()).map(u => u.model());

  Logger.log(TAG, "List account", users.length);

  res.send(new SuccessResponse(sessionId, users));
}
