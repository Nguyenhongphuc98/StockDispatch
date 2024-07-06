import { Server as SocketIOServer, Socket } from "socket.io";
import AppSession from "./account/session";
import { ErrorCode } from "./utils/const";

function logs(...args: any) {
    console.log(new Date().toLocaleString(), "[Socket]", ...args);
}

// Function to clean up listeners
function cleanupListeners(socket) {
    logs("cleanupListeners", socket.id, socket.eventNames());

    // Get all listeners registered on the socket
    const listeners = socket.eventNames();
  
    // Remove all listeners
    listeners.forEach((eventName) => {
      socket.removeAllListeners(eventName);
    });
  
    console.log(`Removed listeners for socket ${socket.id}`);
  }

export function handleSocket(socket: Socket) {

  const authenticate = (sessionId: string) => {
    logs("authenticate ", `${socket.id}: ${sessionId}`, AppSession.isActiveSession(sessionId));

    if (AppSession.isActiveSession(sessionId)) {
        AppSession.updateSocket(sessionId, socket);
        socket.send("authenticate", {
            error_code: 0,
            message: "Authen success.",
            data: ""
        });
    } else {
        socket.send("authenticate", {
            error_code: ErrorCode.InvalidAuth,
            message: "Authen fail.",
            data: ""
        });
        socket.disconnect(true);
    }
  };

  const test = (data: any) => {
    logs("test", data);
    socket.emit("test", data);
  }

  socket.once("authenticate", authenticate);
  socket.on("test", test);

  // Handle 'disconnect' events
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    cleanupListeners(socket);
    AppSession.destroySocketSession(socket.id);
  });


  setTimeout(() => {
    logs("authen timeout", socket.id);

    if (!AppSession.getSocketSession(socket.id)) {
        socket.disconnect(true);
    }
  }, 20000);
}
