import { UserEntity } from "../persistense/users";
import { ErrorCode } from "../utils/const";
import {
  JsonResponse,
  NotEncryptSuccessResponse,
  PermissionDeniedResponse,
  SuccessResponse,
  UnauthenResponse,
} from "../utils/response";
import AppSession from "../manager/session-manager";
import { buildHashedData } from "./utils";
import { Request, Response } from "express";
import Logger from "../loger";
import { commonParams } from "../utils/common-params";

const TAG = "[Auth]";

function respInvalid(res: Response, sessionId: string) {
  res.status(403).send(new UnauthenResponse(sessionId));
}

function respValid(res: Response, sessionId: string, data: any) {
  res.send(new SuccessResponse(sessionId, data));
}

function genNewToken(req: Request) {}

export async function requestLogin(req: Request, resp: Response) {
  const authenSession = AppSession.createAuthenSession();
  resp.send(new NotEncryptSuccessResponse(authenSession));
}

export async function login(req: any, res: any, next: any) {
  const encryptedAuth = req.body.auth;
  const { sessionId } = commonParams(req);
  const auth = AppSession.getAuthData(sessionId, encryptedAuth);

  Logger.log(TAG, "login", sessionId, auth);

  const user = await UserEntity.findOneBy({ username: auth.username });

  if (!user || !user.isActive) {
    respInvalid(res, sessionId);
  } else {
    const hashed = await buildHashedData(auth.password, user.salt);
    if (hashed.hash !== user.password) {
      respInvalid(res, sessionId);
    } else {
      AppSession.createUserSession(sessionId, user.model(), auth.key);
      respValid(res, sessionId, {
        user: user.model()
      });
    }
  }
}

export function getUserInfo(req: Request, res: Response, next: any) {
  const { sessionId } = commonParams(req);
  const user = AppSession.getActiveUser(sessionId);

  Logger.log("get user info: ", sessionId, user);

  res.send(new SuccessResponse(sessionId, {
    user: user,
  }))
}

export function restrict(req: any, res: any, next: any) {
  const { sessionId } = commonParams(req);
  const user = AppSession.getActiveUser(sessionId);

  if (user) {
    Logger.log(TAG, "pass restrict", sessionId, user.username);
    req.user = user;
    next();
  } else {
    Logger.error(TAG, "fail restrict", sessionId);
    res.status(403).send(new PermissionDeniedResponse(sessionId));
  }
}

export function logout(req: any, res: any, next: any) {
  const { sessionId } = commonParams(req);
  AppSession.destroySession(sessionId);
  res.send(new SuccessResponse(sessionId));
}
