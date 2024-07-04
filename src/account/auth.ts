import { User } from "../persistense/users";
import { ErrorCode } from "../utils/const";
import {
  JsonResponse,
  PermissionDeniedResponse,
  SuccessResponse,
  UnauthenResponse,
} from "../utils/response";
import AppSession from "./session";
import { buildHashedData } from "./utils";
import { Request, Response } from "express";

function respInvalid(res: Response) {
  res.status(403).send(new UnauthenResponse({}));
}

function respValid(res: Response, data: any) {
  res.send(new SuccessResponse(data));
}

function genNewToken(req: Request) {}

export async function requestLogin(req: Request, resp: Response) {
  const authenSession = AppSession.createAuthenSession();
  resp.send(new SuccessResponse(authenSession));
}

export async function login(req: any, res: any, next: any) {
  const encryptedAuth = req.body.auth;
  const sessionId = req.headers.sessionid;
  const auth = AppSession.getAuthData(sessionId, encryptedAuth);

  console.log("authe", sessionId, auth);

  const user = await User.findOneBy({ username: auth.username });

  if (!user) {
    respInvalid(res);
  } else {
    const hashed = await buildHashedData(auth.password, user.salt);
    if (hashed.hash !== user.password) {
      respInvalid(res);
    } else {
      const encryptedKey = AppSession.createUserSession(sessionId, user);
      respValid(res, {
        user: user.model(),
        encryptedKey,
      });
    }
  }
}

export function restrict(req: any, res: any, next: any) {
  const sessionId = req.headers.sessionid;
  console.log("session: ", sessionId);

  if (AppSession.isActiveSession(sessionId)) {
    next();
  } else {
    res.status(403).send(new PermissionDeniedResponse());
  }
}

export function logout(req: any, res: any, next: any) {
  const sessionId = req.headers.sessionid;
  AppSession.destroySession(sessionId);
  res.send(new SuccessResponse());
}
