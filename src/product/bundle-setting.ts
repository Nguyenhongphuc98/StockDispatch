import { InvalidPayloadResponse, SuccessResponse } from "../utils/response";
import { Response } from "express";
import Logger from "../loger";
import { JsonRequest } from "../utils/type";
import {
  BundleSettingEntity,
  BundleSettingModel,
} from "../persistense/bundle-setting";
import { commonParams } from "../utils/common-params";

const TAG = "[Box-setting]";
const DEFAULT_BOXES_AMOUNT = 1;

export async function getBundleSettings(req: JsonRequest, res: any, next: any) {
  const { sessionId } = commonParams(req);
  const user = req.user;

  Logger.log(TAG, "get bundle setting", sessionId, user.username);

  const bunddleSettings = await BundleSettingEntity.find();

  res.send(
    new SuccessResponse(sessionId, {
      settings: bunddleSettings,
    })
  );
}

export async function modifyBundleSetting(
  req: JsonRequest,
  res: Response,
  next: any
) {
  const { sessionId } = commonParams(req);
  const user = req.user;
  const { settings, reqid, createat, type } = req.rawBody;

  Logger.log(
    TAG,
    "modify bundle setting",
    sessionId,
    user.username,
    type,
    settings
  );

  if (!Array.isArray(settings)) {
    res.send(new InvalidPayloadResponse(sessionId));
    return;
  }

  const toModifys = settings
    .map((s) => {
      const setting = new BundleSettingEntity();
      setting.init(s as BundleSettingModel);
      return setting;
    })
    .filter((s) => s.validate());

  if (toModifys.length < settings.length) {
    res.send(new InvalidPayloadResponse(sessionId));
    return;
  }

  switch (type) {
    case "add": {
      for (let i = 0; i < toModifys.length; i++) {
        const bundle = toModifys[i];
        if (!(await BundleSettingEntity.findOneBy({ code: bundle.code }))) {
          await BundleSettingEntity.save(bundle);
        }
      }

      res.send(new SuccessResponse(sessionId));
      break;
    }

    case "delete": {
      for (let i = 0; i < toModifys.length; i++) {
        const bundle = await BundleSettingEntity.findOneBy({
          code: toModifys[i].code,
        });
        if (bundle) {
          await BundleSettingEntity.remove(bundle);
        }
      }
      res.send(new SuccessResponse(sessionId));
      break;
    }

    default:
      res.status(403).send(new InvalidPayloadResponse(sessionId));
      break;
  }

  bunddleSettings.reinit();
}

class BundleSettings {
  /**
   * Code - boxes/bundle
   */
  bundleMap: Map<string, number>;

  constructor() {
    this.bundleMap = new Map();
  }

  async reinit() {
    const bunddleSettings = await BundleSettingEntity.find();

    Logger.log(
      TAG,
      "reinit box setting",
      bunddleSettings.map((s) => `${s.code}-${s.amount}`).join(";")
    );

    this.bundleMap.clear();
    bunddleSettings.map((s) => {
      this.bundleMap.set(s.code, s.amount);
    });
  }

  boxesAmount(code: string) {
    return this.bundleMap.get(code) || DEFAULT_BOXES_AMOUNT;
  }
}

export const bunddleSettings = new BundleSettings();
