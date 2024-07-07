import { defaultHandler } from "../utils/response";

export function pkl(app) {
  app.post("/api/v1/pkl", defaultHandler);
  app.put("/api/v1/pkl/:id", defaultHandler);
  app.delete("/api/v1/pkl/:id", defaultHandler);
  app.get("/api/v1/pkl", defaultHandler);
  app.get("/api/v1/pkl/:id", defaultHandler);

  app.post("/api/v1/item", defaultHandler);
  app.get("/api/v1/item", defaultHandler);
}
