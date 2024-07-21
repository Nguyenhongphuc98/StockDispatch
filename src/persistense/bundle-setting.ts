import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { PackingListItemEntity } from "./packling-list-item";
import { UserEntity } from "./users";

export type BundleSettingModel = {
    code: string;
    amount: number;
}

@Entity("BoxSetting")
export class BundleSettingEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @Column({ unique: true})
  code: string;

  @Column()
  amount: number;


  init({code, amount}: BundleSettingModel) {
    this.code = code;
    this.amount = amount;
  }

  validate() {
    for (const p in this) {
      if (Object.prototype.hasOwnProperty.call(this, p)) {
        const element = this[p];
        if (!element) {
          return false;
        }
      }
    }

    return true;
  }

  toModel() {
    return this;
  }
}
