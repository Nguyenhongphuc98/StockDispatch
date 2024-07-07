import { UserModel } from "../persistense/users";
import {
  generateKeyPairSync,
  randomUUID,
  randomBytes,
  privateDecrypt,
} from "crypto";

import socketMamanger from "../socket/socket-manager";
import aeswrapper from "../secure/aes";
import Logger from "../loger"

const IV = "3fa85061a5feaf082ceb752cd360aef4";
const PASSPHRASE = "66771508028AzaZ!@";

type AuthenKey = {
  publicKey: string;
  privateKey: string;
};

type AuthenSession = {
  publicKey: string;
  sessionId: string;
};

type AuthData = {
  username: string;
  password: string;
  key: string;
};

class Session {

  private tag: string = "AppSession";

  /**
   * Mapping sessionId-user
   */
  private sessionMap = new Map<string, UserModel>();

  /**
   * Mapping sessionId-authenKey
   */
  private authenMap = new Map<string, AuthenKey>();

  constructor() {}

  createAuthenSession(): AuthenSession {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs1",
        format: "pem",
        cipher: "aes-256-cbc",
        passphrase: PASSPHRASE,
      },
    });

    const sessionId = randomUUID();
    this.authenMap.set(sessionId, {
      privateKey,
      publicKey,
    });

    setTimeout(() => {
      this.authenMap.delete(sessionId);
    }, 60 * 60 * 1000);

    console.log("[Session] - create new: ", sessionId);

    return {
      sessionId,
      publicKey,
    };
  }

  createUserSession(sessionId: string, user: UserModel, encryptKey: string) {
    this.sessionMap.set(sessionId, user);
    aeswrapper.addSession(sessionId, encryptKey);
  }

  getAuthData(sessionId: string, encryptedData: string): AuthData {
    const authenCache = this.authenMap.get(sessionId);
    this.authenMap.delete(sessionId);

    const defaultResp = {
      username: "",
      password: "",
      key: "",
    };

    if (!authenCache) {
      return defaultResp;
    }

    try {
      const encryptedBuffer = Buffer.from(encryptedData, "base64");

      const decryptedData = privateDecrypt(
        { key: authenCache.privateKey, passphrase: PASSPHRASE },
        encryptedBuffer
      );
      const authData = JSON.parse(decryptedData.toString("utf8"));

      return authData;
    } catch (error) {
      Logger.error(this.tag, "Decryption auth error:", error);
      return defaultResp;
    }
  }

  getActiveUser(sessionId: string) {
    return this.sessionMap.get(sessionId);
  }

  isActiveSession(sessionId: string) {
    return this.sessionMap.has(sessionId);
  }

  destroySession(sessionId: string) {
    Logger.error(this.tag, "Destroy:", sessionId, this.sessionMap.get(sessionId)?.username);

    this.sessionMap.delete(sessionId);

    aeswrapper.removeSession(sessionId);
    socketMamanger.destroySocketSessionBySessiontId(sessionId);
  }

}

const AppSession = new Session();
export default AppSession;
