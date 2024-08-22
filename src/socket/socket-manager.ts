import { Server, Socket } from "socket.io";
import { SocketSession } from "./socket-session";
import Logger from "../loger";
import { SuccessResponse } from "../utils/response";
import { SocketChanel } from "./type";



class SocketManager {
  tag: string = "[Socket][Manager]";

//   host: Server;

  /**
   * Mapping sessionId-socket
   */
  socketMap = new Map<string, SocketSession>();

  constructor() {

    // setTimeout(() => {
    //     setInterval(() => {
    //         this.broasdcast("export", {
    //             itemId: "id-item",
    //             props1: "props1",
    //         });
    //     }, 3000);
    // }, 5000);
  }

//   addHost(host: Server) {
//     this.host = host;
//   }

  broasdcast(chanel: SocketChanel, data: any) {
    this.socketMap.forEach((socket, sessionId) => {
        const respData = new SuccessResponse(sessionId, data);
        Logger.log(this.tag, "broasdcast to", chanel, sessionId, socket.id);
        socket.emit(chanel, respData);
    })
  }

  broasdcastRaw(chanel: SocketChanel, rawData: any) {
    this.socketMap.forEach((socket, sessionId) => {
        socket.emit(chanel, rawData);
    })
  }

  onClientConnect(socket: Socket) {
    const socketSession = new SocketSession(socket, (sessionId: string) => {
        this.addSocketSession(sessionId, socketSession);
    }, () => {
      this.destroySocketSessionBySocketId(socket.id);
    });
    
    socketSession.start();
  }

  addSocketSession(sessionId: string, socket: SocketSession) {
    Logger.log(this.tag, "Add socket session", sessionId, socket.id);
    this.socketMap.set(sessionId, socket);
  }

  getSocketSessionBySocketId(socketId: string) {
    return Array.from(this.socketMap.values()).find(
      (socket) => socket.id == socketId
    );
  }

  getSocketSessionBySessionId(sessionId: string) {
    return this.socketMap.get(sessionId);
  }

  destroySocketSessionBySocketId(socketId: string) {
    Logger.log(this.tag, "Remove socket session by socketId", socketId);
    const sessionId = Array.from(this.socketMap.keys()).find(
      (sid) => this.socketMap.get(sid)?.id == socketId
    );
    const socket = this.socketMap.get(sessionId);
    if (socket) {
        socket.stop("destroySocketSessionBySocketId");
        this.socketMap.delete(sessionId);
    }
  }

  destroySocketSessionBySessiontId(sessionId: string) {
    Logger.log(this.tag, "Remove socket session by sessionId", sessionId);
    const socket = this.socketMap.get(sessionId);
    if (socket) {
        socket.stop("destroySocketSessionBySessiontId");
        this.socketMap.delete(sessionId);
    }
  }
}

const socketMamanger = new SocketManager();
export default socketMamanger;
