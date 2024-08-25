import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  PrimaryColumn,
  Not,
  Index,
  In,
} from "typeorm";
import { PackingListEntity } from "./packing-list";
import { BaseRepository } from "./base";
import { PackingListItemEntity } from "./packling-list-item";


@Entity("Session")
export class SessionEntity extends BaseRepository {

  @PrimaryColumn()
  sessionId: string;

  @Column()
  uid: string;

  @Column()
  key: string;
}
