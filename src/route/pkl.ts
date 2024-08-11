import { restrict } from "../account/auth";
import { getBundleSettings, modifyBundleSetting } from "../middleware/bundle-setting";
import { createPackinglist, getPackinglist, getPackinglists, packinglistModify } from "../middleware/packling-list";
import { createProducts, getProducts } from "../middleware/packling-list-item";
import { decryptBody } from "../secure/aes";
import { validateRequest } from "../secure/request-manager";
import { withErrorHandling } from "../utils/safe";

export function pkl(app) {
  app.post("/api/v1/pkl", restrict, decryptBody, withErrorHandling(createPackinglist));
  app.post("/api/v1/pklm", restrict, decryptBody, validateRequest, withErrorHandling(packinglistModify));
  app.get("/api/v1/pkl", restrict, withErrorHandling(getPackinglists));
  app.get("/api/v1/pkl/:id", restrict, withErrorHandling(getPackinglist));

  app.post("/api/v1/item", restrict, decryptBody, withErrorHandling(createProducts));
  app.get("/api/v1/item", restrict, withErrorHandling(getProducts));

  app.post("/api/v1/setting/bundle", restrict, decryptBody, validateRequest, withErrorHandling(modifyBundleSetting));
  app.get("/api/v1/setting/bundle", restrict, withErrorHandling(getBundleSettings));
}
