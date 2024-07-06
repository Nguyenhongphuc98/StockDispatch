import { User } from "../persistense/users";
import { ErrorCode } from "../utils/const";
import {
  JsonResponse,
  NotEncryptSuccessResponse,
  PermissionDeniedResponse,
  SuccessResponse,
  UnauthenResponse,
} from "../utils/response";
import AppSession from "./session";
import { buildHashedData } from "./utils";
import { Request, Response } from "express";

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
  const sessionId = req.headers.sessionid;
  const auth = AppSession.getAuthData(sessionId, encryptedAuth);

  console.log("login", sessionId, auth);

  const user = await User.findOneBy({ username: auth.username });

  if (!user) {
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
  const sessionId = req.headers.sessionid as string;
  const user = AppSession.getActiveUser(sessionId);

  console.log("get user info: ", sessionId, user);

  res.send(new SuccessResponse(sessionId, {
    user: user,
  }))
}

export function restrict(req: any, res: any, next: any) {
  const sessionId = req.headers.sessionid;
  console.log("session: ", sessionId);

  if (AppSession.isActiveSession(sessionId)) {
    next();
  } else {
    res.status(403).send(new PermissionDeniedResponse(sessionId));
  }
}

export function logout(req: any, res: any, next: any) {
  const sessionId = req.headers.sessionid;
  AppSession.destroySession(sessionId);
  res.send(new SuccessResponse(sessionId));
}
