import { DataSource } from "typeorm";
import { User } from "./users";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "/etc/database/main.db",
    busyErrorRetry: 2,
    enableWAL: true,
    entities: [User],
    synchronize: true
});
