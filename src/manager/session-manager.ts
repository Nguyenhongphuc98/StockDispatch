import { UserEntity, UserModel } from "../persistense/users";
import {
  generateKeyPairSync,
  randomUUID,
  randomBytes,
  privateDecrypt,
} from "crypto";

import socketMamanger from "../socket/socket-manager";
import aeswrapper from "../secure/aes";
import Logger from "../loger"
import { SessionEntity } from "../persistense/session";

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

  private preServeAuthenKey: { publicKey: string, privateKey: string } | null;

  constructor() {
    this.preServeAuthenKey = null;
    // trigger create preserve key.
    this.getAuthenKey();
  }

  async init() {
    const sessions = await SessionEntity.find();

    Logger.error(this.tag, "init session:", sessions.map(s => s.uid));

    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      const user = await UserEntity.findOneBy({id: session.uid});

      if (user) {
        this.createUserSession(session.sessionId, user.model(), session.key, false);
      }
    }
  }

  createAuthenSession(): AuthenSession {
    const { publicKey, privateKey } = this.getAuthenKey();

    const sessionId = randomUUID();
    this.authenMap.set(sessionId, {
      privateKey,
      publicKey,
    });

    setTimeout(() => {
      if (this.authenMap.has(sessionId)) {
        Logger.log("[Session] - authen timeout: ", sessionId);
        this.authenMap.delete(sessionId);
      }
    }, 60 * 60 * 1000);

    Logger.log("[Session] - create new: ", sessionId);

    return {
      sessionId,
      publicKey,
    };
  }

  getAuthenKey() {
    let key = this.preServeAuthenKey;
    this.preServeAuthenKey = null;

    const genKey = () => {
      return generateKeyPairSync("rsa", {
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
    };

    if (!key) {
      key = genKey();
    }
    
    setTimeout(() => {
      this.preServeAuthenKey = genKey();
    }, 1000);

    return key;
  }

  createUserSession(sessionId: string, user: UserModel, encryptKey: string, persist: boolean = true) {
    if (this.sessionMap.has(sessionId)) {
      return;
    }
    Logger.log('create session', sessionId, user);
    this.sessionMap.set(sessionId, user);
    aeswrapper.addSession(sessionId, encryptKey);

    const session = new SessionEntity();
    session.uid = user.id;
    session.sessionId = sessionId;
    session.key = encryptKey;

    if (persist) {
      session.save();
    }
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

  async destroySession(sessionId: string) {
    Logger.error(this.tag, "Destroy:", sessionId, this.sessionMap.get(sessionId)?.username);

    this.sessionMap.delete(sessionId);

    aeswrapper.removeSession(sessionId);
    socketMamanger.destroySocketSessionBySessiontId(sessionId);

    const sessions = await SessionEntity.findBy({sessionId: sessionId});

    if (sessions) {
      await SessionEntity.remove(sessions);
    }
  }

  async destroyUserSession(userId: string) {
    Logger.error(this.tag, "Destroy user sess:", userId);
    const sessionId = Array.from(this.sessionMap.keys()).find(sessionId =>this.sessionMap.get(sessionId).id == userId);

    if (sessionId) {
      this.sessionMap.delete(sessionId);

      aeswrapper.removeSession(sessionId);
      socketMamanger.destroySocketSessionBySessiontId(sessionId);
  
      const sessions = await SessionEntity.findBy({sessionId: sessionId});
  
      if (sessions) {
        await SessionEntity.remove(sessions);
      }
    }
  }

}

const AppSession = new Session();
export default AppSession;
