import { restrict } from "../account/auth";
import { createPackinglist, getPackinglist, getPackinglists } from "../product/packling-list";
import { createProducts, getProducts } from "../product/packling-list-item";
import { decryptBody } from "../secure/aes";
import { defaultHandler } from "../utils/response";

export function pkl(app) {
  app.post("/api/v1/pkl", restrict, decryptBody, createPackinglist);
  app.get("/api/v1/pkl", restrict, getPackinglists);
  app.get("/api/v1/pkl/:id", restrict, getPackinglist);
  app.put("/api/v1/pkl/:id", restrict, decryptBody, defaultHandler);
  app.delete("/api/v1/pkl/:id", restrict, decryptBody, defaultHandler);

  app.post("/api/v1/item", restrict, decryptBody, createProducts);
  app.get("/api/v1/item", restrict, getProducts);
}
