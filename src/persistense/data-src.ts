import { DataSource } from "typeorm";
import { Role, User } from "./users";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "/etc/database/main.db",
    busyErrorRetry: 2,
    enableWAL: true,
    entities: [User],
    synchronize: true
});

export const InitAdmin = async () => {
    const acc = await User.findOneBy({username: 'admin@admin.com'});
    if (!acc) {
        const admin = await User.newAccount('admin@admin.com', 'admin@2024!#$', 'Admin', Role.Admin);
        console.log('init admin success', admin);
    } else {
        console.log('admin already exist!');
    }
}
