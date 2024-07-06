import { getUserInfo, login, logout, requestLogin, restrict } from "../account/auth";

export function auth(app) {
  app.get("/api/v1/reqlogin", requestLogin);
  app.post("/api/v1/login", login);
  app.post("/api/v1/logout", restrict, logout);
  app.get("/api/v1/authenticate", restrict, getUserInfo);
}
