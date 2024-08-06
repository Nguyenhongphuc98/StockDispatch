import { getUserInfo, login, logout, requestLogin, restrict } from "../account/auth";
import { withErrorHandling } from "../utils/safe";

export function auth(app) {
  app.get("/api/v1/reqlogin", withErrorHandling(requestLogin));
  app.post("/api/v1/login", withErrorHandling(login));
  app.post("/api/v1/logout", restrict, withErrorHandling(logout));
  app.get("/api/v1/authenticate",restrict,  withErrorHandling(getUserInfo));
}
