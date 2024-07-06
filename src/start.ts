import AppSession from "./account/session";
import { AppDataSource, InitAdmin } from "./persistense/data-src";
import { Server as SocketIOServer, Socket } from 'socket.io';

const origins = [
    "http://127.0.0.1:5500",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ];
  const corsOptions = {
    origin: origins,
    "Access-Control-Allow-Credentials": true,
    credentials: true,
    "Access-Control-Allow-Origin": origins,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };

export function start(server) {
  const io = new SocketIOServer(server, {
    cors: corsOptions 
  });
  AppDataSource.initialize()
    .then(async () => {
      console.log("Data Source has been initialized!");

      /**
       * Create admin account
       */
      InitAdmin();

      server.listen(8080, () => {
        console.log(`Example app listening on port ${8080}`);
      });

      io.on("connection", (socket: Socket) => {
        console.log(`Client connected: ${socket.id}`);
        debugger;
        // if (AppSession.isActiveSession(sessionId))
    
    
        // Handle 'chat message' events
        socket.on("chat message", (msg: string) => {
          console.log(`Message from ${socket.id}: ${msg}`);
          // Broadcast the message to all connected clients
          io.emit("chat message", msg);
        });
    
        // Handle 'disconnect' events
        socket.on("disconnect", () => {
          console.log(`Client disconnected: ${socket.id}`);
        });
      });
    })
    .catch((err) => {
      console.error("Error during Data Source initialization", err);
    });

  
}
