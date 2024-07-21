import { restrict } from "../account/auth";
import { getBundleSettings, modifyBundleSetting } from "../product/bundle-setting";
import { createPackinglist, getPackinglist, getPackinglists, packinglistModify } from "../product/packling-list";
import { createProducts, getProducts } from "../product/packling-list-item";
import { decryptBody } from "../secure/aes";
import { validateRequest } from "../secure/request-manager";
import { defaultHandler } from "../utils/response";

export function pkl(app) {
  app.post("/api/v1/pkl", restrict, decryptBody, createPackinglist);
  app.post("/api/v1/pklm", restrict, decryptBody, validateRequest, packinglistModify);
  app.get("/api/v1/pkl", restrict, getPackinglists);
  app.get("/api/v1/pkl/:id", restrict, getPackinglist);
  app.put("/api/v1/pkl/:id", restrict, decryptBody, defaultHandler);
  app.delete("/api/v1/pkl/:id", restrict, decryptBody, defaultHandler);

  app.post("/api/v1/item", restrict, decryptBody, createProducts);
  app.get("/api/v1/item", restrict, getProducts);

  app.post("/api/v1/setting/bundle", restrict, decryptBody, validateRequest, modifyBundleSetting);
  app.get("/api/v1/setting/bundle", restrict, getBundleSettings);
}
