import { User } from "../persistense/users";
import { ErrorCode } from "../utils/const";
import { ResponseJson } from "../utils/response";
import { buildHashedData } from "./utils";
import { Request, Response } from "express";

function respInvalid(res: Response) {
  res.send(
    new ResponseJson(ErrorCode.InvalidAuth, {
      mesage: "Invalid username or password",
    })
  );
}

function respValid(res: Response) {
  res.send(
    new ResponseJson(ErrorCode.Success, {
      mesage: "Login success",
    })
  );
}

export async function authenticate(req: any, res: any, next: any) {
  const username = req.body.username;
  const password = req.body.password;

  console.log("authenticating %s:%s", username, password);
  const user = await User.findOneBy({username: username});


  if (!user) {
    respInvalid(res);
  } else {
    const hashed = await buildHashedData(password, user.salt);
    if (hashed.hash !== user.password) {
      respInvalid(res);
    } else {
      req.session.regenerate(function () {
        req.session.user = user;
        req.session.success = 'Authenticated as ' + user.username;
      });
      respValid(res);
    }
  }
}

export function restrict(req: any, res: any, next: any) {
    console.log('session', req.session.id);
  if (req.session.id) {
    next();
  } else {
    req.session.error = "Access denied!";
    res.send(new ResponseJson(ErrorCode.PermissionDenied, {
        message: "Need auth before!"
    }));
  }
}

export function logout(req: any, res: any, next: any) {
    req.session.destroy(function(){
        res.send(new ResponseJson(ErrorCode.Success, {
            message: "Logout success!"
        }));
    });
}
