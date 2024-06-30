import { Role, User } from "../persistense/users";
import { ErrorCode } from "../utils/const";
import { JsonResponse } from "../utils/response";
import { buildHashedData } from "./utils";
import { Request, Response } from "express";

export async function createAccount(req: Request, res: Response, next: any) {
  const username = req.body.username;
  const password = req.body.password;

  const existed = await User.findOneBy({ username: username });
  if (existed) {
    res.send(
      new JsonResponse(ErrorCode.AccountExists, {
        message: "username already exists!",
      })
    );
    return;
  }

  console.log("create account %s:%s", username, password);

  const hashed = await buildHashedData(password);
  const user = new User();

  user.username = username;
  user.password = hashed.hash;
  user.salt = hashed.salt;
  user.isActive = true;
  user.role = Role.User;

  await user.save();

  res.send(
    new JsonResponse(ErrorCode.Success, {
      message: "create account success!",
    })
  );
}
