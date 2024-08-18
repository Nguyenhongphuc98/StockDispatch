import { restrict } from "../account/auth";
import { getBundleSettings, modifyBundleSetting } from "../middleware/bundle-setting";
import { decryptBody } from "../secure/aes";
import { validateRequest } from "../secure/request-manager";
import { withErrorHandling } from "../utils/safe";

export function bundles(app) {
  app.post("/api/v1/setting/bundle", restrict, decryptBody, validateRequest, withErrorHandling(modifyBundleSetting));
  app.get("/api/v1/setting/bundle", restrict, withErrorHandling(getBundleSettings));
}
