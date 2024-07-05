import { UserModel } from "../persistense/users";
import {
  generateKeyPairSync,
  randomUUID,
  randomBytes,
  privateDecrypt,
} from "crypto";
import { AES, enc } from "crypto-js";
// var CryptoJS = require("crypto-js");

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
  /**
   * Mapping sessionId-user
   */
  sessionMap = new Map<string, UserModel>();

  /**
   * Mapping sessionId-encryptKey
   */
  encryptKeyMap = new Map<string, string>();

  /**
   * Mapping sessionId-authenKey
   */
  authenMap = new Map<string, AuthenKey>();

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
    this.encryptKeyMap.set(sessionId, encryptKey);
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
      console.error("Decryption Error:", error);
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
    this.sessionMap.delete(sessionId);
    this.encryptKeyMap.delete(sessionId);
  }

  aesEncrypt(sessionId: string, rawData: any) {
    const secretKey = this.encryptKeyMap.get(sessionId);
    const ciphertext = AES.encrypt(JSON.stringify(rawData), secretKey).toString();
    return ciphertext;
  }

  aaesDecrypt(sessionId: string, encryptedData: any) {
    const secretKey = this.encryptKeyMap.get(sessionId);
    const bytes = AES.decrypt(encryptedData, secretKey);
    const rawData = JSON.parse(bytes.toString(enc.Utf8));

    return rawData;
  }
}

const AppSession = new Session();
export default AppSession;
