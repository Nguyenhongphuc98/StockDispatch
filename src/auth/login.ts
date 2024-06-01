import { ErrorCode } from "../utils/const";
import { ResponseJson } from "../utils/response";

const hash = require("pbkdf2-password")();

// dummy database

const users: any = {
  tj: { name: "tj" },
};

hash({ password: "abc" }, function (err: any, pass: any, salt: any, hash: any) {
  if (err) throw err;
  // store the salt & hash in the "db"
  users.tj.salt = salt;
  users.tj.hash = hash;
});

export function authenticate(req: any, res: any, next: any) {
  const name = req.body.username;
  const pass = req.body.password;

  console.log("authenticating %s:%s", name, pass);
  const user = users[name];
  // query the db for the given username
  if (!user)
    return res.send(
      new ResponseJson(ErrorCode.InvalidAuth, {
        mesage: "Invalid username or password",
      })
    );

  hash(
    { password: pass, salt: user.salt },
    function (err: any, pass: string, salt: any, hash: any) {
      if (err)
        return res.send(
          new ResponseJson(ErrorCode.InvalidAuth, {
            mesage: "Cannot authen with username or password",
          })
        );
      if (hash === user.hash) {
        req.session.regenerate(function () {
          req.session.user = user;
        });
        return next(null, user);
      }
      return res.send(
        new ResponseJson(ErrorCode.InvalidAuth, {
          mesage: "Invalid username or password",
        })
      );
    }
  );
}

export function restrict(req: any, res: any, next: any) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = "Access denied!";
    res.send(new ResponseJson(ErrorCode.PermissionDenied, {}));
  }
}
