import { Server as SocketIOServer, Socket } from "socket.io";
import AppSession from "../account/session";
import { ErrorCode } from "../utils/const";
import Logger from "../loger";
import { SocketChanel } from "./type";

export class SocketSession {
  tag: string = "[Socket][session]";
  
  authenticated: boolean;

  constructor(
    private socket: Socket,
    private readonly didAuthenticate: (sessionId: string) => void,
    private readonly didDisconnected: () => void
  ) {
    this.authenticated = false;
  }

  get id() {
    return this.socket.id;
  }

  public start() {
    Logger.log(this.tag, `Client connected: ${this.socket.id}`);

    this.socket.once("authenticate", this.authenticate.bind(this));
    this.socket.once("disconnect", this.disconnected.bind(this));

    setTimeout(() => {
      if (!this.authenticated) {
        Logger.log("authen timeout", this.socket.id);
        this.stop("timeout");
      }
    }, 10000);
  }

  public stop(reason: string) {
    if (this.socket) {
      Logger.log(this.tag, "close socket due to", reason, this.socket.id);
      this.socket.disconnect(true);
    }
  }

  emit(chanel: SocketChanel, data: any) {
    this.socket.emit(chanel, data);
  }

  private authenticate(sessionId: string) {
    Logger.log(
      this.tag,
      "authenticate ",
      `${this.socket.id}: ${sessionId}`,
      AppSession.isActiveSession(sessionId)
    );

    if (AppSession.isActiveSession(sessionId)) {
      Logger.log(
        this.tag,
        "authen success: ",
        this.socket.id,
        AppSession.getActiveUser(sessionId).username
      );
      this.authenticated = true;
      this.didAuthenticate(sessionId);
      this.socket.send("authenticate", {
        error_code: 0,
        message: "Authen success.",
        data: "",
      });
    } else {
      this.socket.send("authenticate", {
        error_code: ErrorCode.InvalidAuth,
        message: "Authen fail.",
        data: "",
      });
      this.socket.disconnect(true);
    }
  }

  private disconnected() {
    Logger.log(this.tag, `Client disconnected: ${this.socket.id}`);
    this.cleanupListeners();
    this.didDisconnected();
  }

  private cleanupListeners() {
    Logger.log(this.tag, "cleanupListeners", this.socket.id, this.socket.eventNames());

    // Get all listeners registered on the socket
    const listeners = this.socket.eventNames();

    // Remove all listeners
    listeners.forEach((eventName) => {
      this.socket.removeAllListeners(eventName);
    });

    Logger.log(this.tag, `Removed listeners for socket ${this.socket.id}`);
  }
}
