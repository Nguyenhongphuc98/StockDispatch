import { DataSource } from "typeorm";
import { Role, UserEntity } from "./users";
import { PackingListEntity } from "./packing-list";
import { PackingListItemEntity } from "./packling-list-item";
import { BundleSettingEntity } from "./bundle-setting";
import { ExportEntity } from "./export";
import { SubItemEntity } from "./sub-item";
import { SessionEntity } from "./session";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "/etc/database/main.db",
  busyErrorRetry: 2,
  enableWAL: true,
  entities: [
    UserEntity,
    PackingListEntity,
    PackingListItemEntity,
    BundleSettingEntity,
    ExportEntity,
    SubItemEntity,
    SessionEntity,
  ],
  synchronize: true,
  // logging: true,
});

export const InitAdmin = async () => {
  const acc = await UserEntity.findOneBy({ username: "admin@admin.com" });
  if (!acc) {
    const admin = await UserEntity.newAccount(
      "admin@admin.com",
      "admin@2024!#$",
      "Admin",
      Role.Admin
    );
    console.log("init admin success", admin);
  } else {
    console.log("admin already exist!");
  }
};
