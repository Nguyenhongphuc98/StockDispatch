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

export type PackingListModel = {
  name: string;
  attachedInvoiceId: string;
  date: number;
  from: string;
  to: string;
  etdFactory: string;
  etdPort: string;
  eta: string;
};

@Entity("PackingList")
export class PackingListEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @ManyToOne(() => UserEntity, (u) => u.packingLists)
  createdBy: UserEntity;

  @Column()
  name: string;

  @Column()
  attachedInvoiceId: string;

  @Column()
  date: number;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column()
  etdFactory: string;

  @Column()
  etdPort: string;

  @Column()
  eta: string;

  @OneToMany(() => PackingListItemEntity, (it) => it.packingList, { cascade: ['remove'] })
  items: PackingListItemEntity[];

  init(model: PackingListModel, creator: UserEntity) {
    this.createdBy = creator;
    this.attachedInvoiceId = model.attachedInvoiceId;
    this.date = model.date;
    this.from = model.from;
    this.to = model.to;
    this.etdFactory = model.etdFactory;
    this.etdPort = model.etdPort;
    this.eta = model.eta;
    this.items = [];
    this.name = model.name;
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

  static getByIdWithCreateBy(id: string) {
    return PackingListEntity.createQueryBuilder("pkl")
      .leftJoin("pkl.createdBy", "User")
      .addSelect(["User.displayName", "User.username"])
      .where("pkl.id = :id", { id })
      .leftJoin("pkl.items", PackingListItemEntity.name)
      .loadRelationCountAndMap("pkl.itemsCount", "pkl.items")
      .getOne();
  }

  static async getPackingLists(
    max: number,
    filterDate: Date | undefined = undefined,
    filterName: string | undefined = undefined
  ): Promise<PackingListEntity[]> {
    const query = await PackingListEntity.createQueryBuilder("pl")
      .leftJoin("pl.createdBy", "User")
      .addSelect(["User.displayName", "User.username"]);

    if (filterDate) {
      query.where("pl.createAt <= :filterDate", { filterDate });
    }

    if (filterName) {
      query.andWhere("pl.name LIKE :filterName", {
        filterName: `%${filterName}%`,
      });
    }

    const packingLists = query
      .orderBy("pl.createAt", "DESC")
      .leftJoin("pl.items", PackingListItemEntity.name)
      .loadRelationCountAndMap("pl.itemsCount", "pl.items")
      .limit(max)
      .getMany();

    return packingLists;
  }
}
