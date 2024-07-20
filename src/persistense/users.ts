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
import { PackingListEntity } from "./packing-list";

export enum Role {
  Admin = 1,
  User = 2,
}

export type UserModel = {
  id: string,
  username: string,
  displayName: string,
  isActive: boolean,
  role: Role,
}

@Entity("User")
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn({})
  id: string;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

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

  @OneToMany(() => PackingListEntity, pl => pl.createdBy)
  packingLists: PackingListEntity;

  public model(): UserModel {
    return {
      id: this.id,
      username: this.username,
      displayName: this.displayName,
      isActive: this.isActive,
      role: this.role,
    };
  }

  async updatePassword(newPassword: string) {
    const hashed = await buildHashedData(newPassword);
    this.password = hashed.hash;
    this.salt = hashed.salt;
    await this.save();
  }

  async updateDisplayName(newDispalayName: string) {
    this.displayName = newDispalayName;
    await this.save();
  }

  async checkSamePassword(rawPass: string) {
    const hashed = await buildHashedData(rawPass, this.salt);
    console.log("abcc: ", hashed.hash == this.password)
    return hashed.hash == this.password;
  }

  static async newAccount(
    username: string,
    password: string,
    displayName: string,
    role: Role
  ) {
    const hashed = await buildHashedData(password);
    const user = new UserEntity();

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
