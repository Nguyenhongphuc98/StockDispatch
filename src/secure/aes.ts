import { AES, enc } from "crypto-js";
import Logger from "../loger";
import { Request, Response } from "express";
import { InvalidPayloadResponse } from "../utils/response";
import { commonParams } from "../utils/common-params";
const TAG = "[AES]";

class AESWrapper {

  
  /**
   * Mapping sessionId-encryptKey
   */
  private encryptKeyMap = new Map<string, string>();

  constructor() {}

  addSession(sessionId: string, encryptKey: string) {
    this.encryptKeyMap.set(sessionId, encryptKey);
  }

  removeSession(sessionId: string) {
    this.encryptKeyMap.delete(sessionId);
  }

  encrypt(sessionId: string, rawData: any) {
    const secretKey = this.encryptKeyMap.get(sessionId);
    const ciphertext = AES.encrypt(
      JSON.stringify(rawData),
      secretKey
    ).toString();
    return ciphertext;
  }

  decrypt(sessionId: string, encryptedData: any) {
    const secretKey = this.encryptKeyMap.get(sessionId);
    const bytes = AES.decrypt(encryptedData, secretKey);
    const rawData = JSON.parse(bytes.toString(enc.Utf8));

    return rawData;
  }

  encryptUseKey(key: string, rawData: any) {
    const ciphertext = AES.encrypt(
      JSON.stringify(rawData),
      key
    ).toString();
    return ciphertext;
  }

  decryptUseKey(key: string, encryptedData: any) {
    const bytes = AES.decrypt(encryptedData, key);
    const rawData = JSON.parse(bytes.toString(enc.Utf8));

    return rawData;
  }
}

export function decryptBody(req: Request, resp: Response, next: any) {
    const data = req.body["data"];
    const { sessionId } = commonParams(req);

    try {
        //@ts-ignore
        req.rawBody = aeswrapper.decrypt(sessionId, data);
        next();
    } catch (error) {
        Logger.error(TAG, "decrypt err:", data, error);
        resp.send(new InvalidPayloadResponse(sessionId));
    }
}

const aeswrapper = new AESWrapper();
export default aeswrapper;
