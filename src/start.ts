import AppSession from "./account/session";
import { corsOptions } from "./cors";
import { AppDataSource, InitAdmin } from "./persistense/data-src";
import { Server as SocketIOServer, Socket } from "socket.io";
import SocketMamanger from "./socket/socket-manager";
import exportManager from "./export/export-manager";
import { bunddleSettings } from "./product/bundle-setting";

export function start(server) {
  const io = new SocketIOServer(server, {
    cors: corsOptions,
  });
  AppDataSource.initialize()
    .then(async () => {
      console.log("Data Source has been initialized!");

      /**
       * Create admin account
       */
      InitAdmin();

      exportManager.init();

      bunddleSettings.reinit();

      server.listen(8080, () => {
        console.log(`Example app listening on port ${8080}`);
      });

      io.on("connection", (socket: Socket) => {
        SocketMamanger.onClientConnect(socket);
      });
    })
    .catch((err) => {
      console.error("Error during Data Source initialization", err);
    });
}
