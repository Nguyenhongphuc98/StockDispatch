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
  Index,
} from "typeorm";
import { UserEntity } from "./users";
import { PackingListEntity, PKLStatus } from "./packing-list";
import { BaseRepository } from "./base";
import { PackingListItemEntity } from "./packling-list-item";
import { generateRandomString } from "../utils/string";
import { SubItemEntity } from "./sub-item";
import subItemController from "../controller/subitem-controller";

export type ExportModel = {
  createdBy: UserEntity;
  name: string;
  gate: string;
  fcl: string;
  contNum: string;
  contSize: string;
  vehicle: string;
  seal: string;
  customer: string;
  items: PackingListEntity[];
};

export enum ExportStatus {
  Imported = 0,
  Exporting = 1,
  Exported = 2,
}

@Entity("Export")
export class ExportEntity extends BaseRepository {
  @PrimaryGeneratedColumn()
  id: string;

  @CreateDateColumn()
  @Index("IDX_E_CA")
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @ManyToOne(() => UserEntity, (u) => u.packingLists)
  createdBy: UserEntity;

  @Column()
  @Index("IDX_E_NAME")
  name: string;

  @Column()
  gate: string;

  @Column()
  fcl: string;

  @Column()
  contNum: string;

  @Column()
  contSize: string;

  @Column()
  vehicle: string;

  @Column()
  seal: string;

  @Column()
  customer: string;

  @Column()
  status: ExportStatus;

  @OneToMany(() => PackingListEntity, (it) => it.export)
  items: PackingListEntity[];

  // key use to encrypt data
  @Column()
  key: string;

  init(model: ExportModel, creator: UserEntity, items: PackingListEntity[]) {
    this.createdBy = creator;
    this.items = items;
    this.name = model.name;
    this.gate = model.gate;
    this.fcl = model.fcl;
    this.contNum = model.contNum;
    this.contSize = model.contSize;
    this.vehicle = model.vehicle;
    this.seal = model.seal;
    this.customer = model.customer;
    this.status = ExportStatus.Exporting;
    this.key = generateRandomString(10);
  }

  toModel() {
    return this;
  }

  // static async getByIdWithCreateByAndItems(id: string) {
  //   const exportItem: any = await ExportEntity.createQueryBuilder("e")
  //     .leftJoin("e.createdBy", "User")
  //     .addSelect(["User.displayName", "User.username"])
  //     .where("e.id = :id", { id })
  //     .leftJoinAndSelect("e.items", PackingListItemEntity.name)
  //     .getOne();

  //     if (exportItem) {
  //       exportItem.itemsCount = await this.countTotalExportItems(exportItem);
  //       exportItem.exportedCount = await this.countExportedItems(exportItem);
  //     }

  //     return exportItem;
  // }

  static async getExports(
    max: number,
    filterDate: Date | undefined = undefined,
    filterName: string | undefined = undefined,
    status: PKLStatus = undefined
  ): Promise<ExportEntity[]> {
    const query = await ExportEntity.createQueryBuilder("e")
      .leftJoin("e.createdBy", "User")
      .addSelect(["User.displayName", "User.username"]);

    if (filterDate) {
      query.where("e.createAt <= :filterDate", { filterDate });
    }

    if (filterName) {
      query.andWhere("e.name LIKE :filterName", {
        filterName: `%${filterName}%`,
      });
    }

    if (status) {
      query.andWhere("e.status = :status", { status });
    }

    const packingLists = query
      .orderBy("e.createAt", "DESC")
      .leftJoinAndSelect("e.items", PackingListItemEntity.name)
      .take(max)
      .getMany();

    return packingLists;
  }

  // static async countTotalExportItems(exportItem: ExportEntity) {
  //   const pklIds = exportItem.items.map(i => i.id);
  //   const totalCount = await subItemController.countAll(pklIds);

  //   return totalCount;
  // }

  // static async countExportedItems(exportItem: ExportEntity) {
  //   const pklIds = exportItem.items.map(i => i.id);
  //   const totalCount = await subItemController.countExported(pklIds);

  //   return totalCount;
  // }
}
