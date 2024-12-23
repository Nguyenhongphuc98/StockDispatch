import { restrict } from "../account/auth";
import { createPackinglist, getPackinglist, getPackinglists, packinglistModify } from "../middleware/packling-list";
import { createProducts, getProducts } from "../middleware/packling-list-item";
import { decryptBody } from "../secure/aes";
import { validateRequest } from "../secure/request-manager";
import { withErrorHandling } from "../utils/safe";

export function pkl(app) {
  app.post("/api/v1/pkl", restrict, decryptBody, validateRequest, withErrorHandling(createPackinglist));
  app.post("/api/v1/pklm", restrict, decryptBody, validateRequest, withErrorHandling(packinglistModify));
  app.get("/api/v1/pkl", restrict, withErrorHandling(getPackinglists));
  app.get("/api/v1/pkl/:id", restrict, withErrorHandling(getPackinglist));

  app.post("/api/v1/item", restrict, decryptBody, validateRequest, withErrorHandling(createProducts));
  app.get("/api/v1/item", restrict, withErrorHandling(getProducts));
}
