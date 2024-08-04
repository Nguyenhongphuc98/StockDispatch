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
  OneToMany,
  Index,
} from "typeorm";
import { PackingListEntity } from "./packing-list";
import { BaseRepository } from "./base";
import { SubItemEntity } from "./sub-item";

export type PackingListItemModel = {
  packageSeries: [number, number];
  po: string;
  packageId: string;
  itemsInPackage: number;
  itemsUnit: string;
  netWeight: number;
  grossWeight: number;
  netWeightUnit: string;
  grossWeightUnit: string;
  width: number;
  length: number;
  height: number;
  sizeUnit: string;
  sku: string;
};

@Entity("PackingListItem")
@Index("IDX_PKLI_PKL", ["packingList"])
export class PackingListItemEntity extends BaseRepository {
  @PrimaryGeneratedColumn()
  id: string;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @ManyToOne(() => PackingListEntity, (pl) => pl.items, { onDelete: "CASCADE" })
  packingList: PackingListEntity;

  @OneToMany(() => SubItemEntity, (wli) => wli.packingListItem)
  weighList: SubItemEntity[];

  @Column()
  packageSeries: string;

  @Column()
  po: string;

  @Column({ nullable: true })
  sku: string;

  @Column()
  packageId: string;

  @Column()
  itemsInPackage: number;

  @Column()
  itemsUnit: string;

  @Column()
  netWeight: number;

  @Column()
  grossWeight: number;

  @Column()
  netWeightUnit: string;

  @Column()
  grossWeightUnit: string;

  @Column()
  width: number;

  @Column()
  length: number;

  @Column()
  height: number;

  @Column()
  sizeUnit: string;

  init(model: PackingListItemModel, packingList: PackingListEntity) {
    const series = model.packageSeries;
    this.packageSeries = `${series[0]}-${series[1]}`;
    this.packageId = model.packageId;
    this.po = model.po;
    this.sku = '';
    this.itemsInPackage = model.itemsInPackage;
    this.itemsUnit = model.itemsUnit;
    this.netWeight = model.netWeight;
    this.grossWeight = model.grossWeight;
    this.netWeightUnit = model.netWeightUnit;
    this.grossWeightUnit = model.grossWeightUnit;
    this.width = model.width;
    this.length = model.length;
    this.height = model.height;
    this.sizeUnit = model.sizeUnit;
    this.packingList = packingList;
    this.weighList = [];
  }

  toModel() {
    return {
      ...this,
      packageSeries: [this.startSeries(), this.endSeries()],
    };
  }

  startSeries() {
    const parsedSeries = this.packageSeries.split("-");
    return Number(parsedSeries[0]);
  }

  endSeries() {
    const parsedSeries = this.packageSeries.split("-");
    return Number(parsedSeries[1]);
  }

  static async getPackingListItemsByPage(
    page: number,
    pageSize: number,
    packageIdPattern: string,
    packingListId: string
  ) {
    const [pklItems, totalCount] = await PackingListItemEntity.createQueryBuilder(
      "item"
    )
      .where("item.packageId LIKE :packageIdPattern", {
        packageIdPattern: `%${packageIdPattern}%`,
      })
      .andWhere("item.packingListId = :packingListId", { packingListId })
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    const hasMore = totalCount > page * pageSize;

    return {
      pklItems,
      hasMore,
    };
  }
}
