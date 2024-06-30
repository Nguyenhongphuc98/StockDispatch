import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  Unique,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { buildHashedData } from "../account/utils";
// import { PackingList } from "./packing-lists";

export enum Role {
  Admin = 1,
  User = 2,
}

@Entity("User")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn({})
  id: string;

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;

  @Column("text", { unique: true })
  username: string;

  @Column("text")
  password: string;

  @Column("text")
  displayName: string;

  @Column("boolean")
  isActive: boolean;

  @Column("int")
  role: Role;

  @Column("text")
  salt: string;

  // @OneToMany(() => PackingList, pl => pl.updater)
  // packingLists: PackingList;

  public model() {
	return {
		username: this.username,
		password: this.password,
		displayName: this.displayName,
		isActive: this.isActive,
		role: this.role,
	}
  }

  static async newAccount(
    username: string,
    password: string,
    displayName: string,
    role: Role
  ) {
    const hashed = await buildHashedData(password);
    const user = new User();

    user.username = username;
    user.password = hashed.hash;
    user.displayName = displayName;
    user.salt = hashed.salt;
    user.isActive = true;
    user.role = role;

	await user.save();

	return user.model();
  }
}
