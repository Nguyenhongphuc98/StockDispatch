import { InvalidPayloadResponse, SuccessResponse } from "../utils/response";
import { Response } from "express";
import Logger from "../loger";
import { JsonRequest } from "../utils/type";
import {
  BundleSettingEntity,
  BundleSettingModel,
} from "../persistense/bundle-setting";

const TAG = "[Box-setting]";

export async function getBundleSettings(req: JsonRequest, res: any, next: any) {
  const sessionId = req.headers["sessionid"];
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
  const sessionId = req.headers["sessionid"];
  const user = req.user;
  const { settings, reqid, createat, type } = req.rawBody;

  Logger.log(TAG, "modify box setting", sessionId, user.username, type, settings);

  if (!Array.isArray(settings)) {
    res.send(new InvalidPayloadResponse());
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
    res.send(new InvalidPayloadResponse());
    return;
  }

  switch (type) {
    case "add": {
      for (let i = 0; i < toModifys.length; i++) {
        const bundle = toModifys[i];
        if (!await BundleSettingEntity.findOneBy({ code: bundle.code })) {
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
}
