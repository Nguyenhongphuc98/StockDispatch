import { Role, UserEntity } from "../persistense/users";
import { ErrorCode } from "../utils/const";
import {
  AccountExistsResponse,
  AccountNotExistsResponse,
  InvalidPayloadResponse,
  JsonResponse,
  PasswordMissmatchResponse,
  PermissionDeniedResponse,
  SuccessResponse,
} from "../utils/response";
import { JsonRequest } from "../utils/type";
import { Request, Response } from "express";
import Logger from "../loger";
import AppSession from "./session";
import { generateRandomString } from "../utils/string";

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

export async function authorizeAdmin(
  req: JsonRequest,
  res: Response,
  next: any
) {
  const sessionId = req.headers["sessionid"];
  const user = AppSession.getActiveUser(sessionId);

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

  const existsUser = await UserEntity.findOneBy({ username: username });
  Logger.log(TAG, "Create account", username, password, !existsUser);

  if (existsUser) {
    res.send(new AccountExistsResponse(sessionId));
    next();
    return;
  }

  const user = await UserEntity.newAccount(
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
  const oldpassword = req.rawBody.oldpassword;
  const displayName = req.rawBody.displayName;

  const user = await UserEntity.findOneBy({ id: id });

  if (!user) {
    Logger.log(TAG, "Update not exists account", id, password, displayName);
    res.send(new AccountNotExistsResponse(sessionId));
    return;
  }

  if (!password && !displayName) {
    Logger.log(TAG, "Update account invalid payload", id, user.username);
    res.send(new InvalidPayloadResponse(sessionId));
    return;
  }

  if (password) {
    if (!oldpassword || !(await user.checkSamePassword(oldpassword))) {
      Logger.log(
        TAG,
        "Update pass: invalid old pass",
        user.username,
        oldpassword,
        password
      );
      res.status(403).send(new PasswordMissmatchResponse(sessionId));
      return;
    }

    Logger.log(TAG, "Update pass", user.username, password);
    await user.updatePassword(password);
  }

  if (displayName) {
    Logger.log(
      TAG,
      "Update displayname",
      user.username,
      user.displayName,
      "=>",
      displayName
    );
    await user.updateDisplayName(displayName);
  }

  res.send(new SuccessResponse(sessionId, user.model()));
}

export async function listAccounts(req: JsonRequest, res: Response, next: any) {
  const sessionId = req.headers["sessionid"];

  const users = (await UserEntity.find()).map((u) => u.model());

  Logger.log(TAG, "List account", users.length);

  res.send(new SuccessResponse(sessionId, users));
}

export async function adminUpdate(req: JsonRequest, res: Response, next: any) {
  const sessionId = req.headers["sessionid"];
  const { uid, reqid, createat, type } = req.rawBody;

  const user = await UserEntity.findOneBy({ id: uid });

  if (!user) {
    Logger.log(TAG, "Call update for not exists account", uid);
    res.send(new AccountNotExistsResponse(sessionId));
    return;
  }

  switch (type) {
    case "reset": {
      const newPass = generateRandomString(8);

      Logger.log(TAG, "Reset pass", user.username, newPass);
      await user.updatePassword(newPass);
      res.send(new SuccessResponse(sessionId, { newPass }));
      break;
    }
    case "lock": {
      user.isActive = false;
      await user.save();
      Logger.log(TAG, "Lock user", user.username);
      res.send(new SuccessResponse(sessionId));
      break;
    }
    case "unlock": {
      user.isActive = true;
      await user.save();
      Logger.log(TAG, "Unlock user", user.username);
      res.send(new SuccessResponse(sessionId));
      break;
    }

    default:
      res.status(403).send(new InvalidPayloadResponse(sessionId));
      break;
  }
}
