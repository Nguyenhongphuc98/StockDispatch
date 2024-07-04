import { User } from "../persistense/users";
import {
  generateKeyPairSync,
  randomUUID,
  randomBytes,
  privateDecrypt,
} from "crypto";

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
};

class Session {
  /**
   * Mapping sessionId-user
   */
  sessionMap = new Map<string, User>();

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

  createUserSession(sessionId: string, user: User) {
    const encryptKey = randomUUID();
    this.sessionMap.set(sessionId, user);
    this.encryptKeyMap.set(sessionId, encryptKey);

    return encryptKey;
  }

  getAuthData(sessionId: string, encryptedData: string): AuthData {
    const authenCache = this.authenMap.get(sessionId);
    this.authenMap.delete(sessionId);

    const defaultResp = {
      username: "",
      password: "",
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

  isActiveSession(sessionId: string) {
    debugger;
    return this.sessionMap.has(sessionId);
  }

  destroySession(sessionId: string) {
    this.sessionMap.delete(sessionId);
    this.encryptKeyMap.delete(sessionId);
  }
}

const AppSession = new Session();
export default AppSession;
