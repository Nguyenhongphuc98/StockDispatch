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
} from "typeorm";
import { PackingListEntity } from "./packing-list";
import { BaseRepository } from "./base";
import { WeighListItemEntity } from "./weigh-item";

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

enum PKLItemStatus {
  Imported = 0,
  Exported = 2,
}

@Entity("PackingListItem")
export class PackingListItemEntity extends BaseRepository {
  @PrimaryGeneratedColumn()
  id: string;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @ManyToOne(() => PackingListEntity, (pl) => pl.items)
  packingList: PackingListEntity;

  @OneToMany(() => WeighListItemEntity, (wli) => wli.packingListItem, { cascade: ['remove'] })
  weighList: WeighListItemEntity[];

  @Column()
  packageSeries: string;

  @Column()
  po: string;

  @Column({nullable: true})
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

  @Column()
  status: PKLItemStatus;

  init(model: PackingListItemModel, packingList: PackingListEntity) {
    const series = model.packageSeries;
    this.packageSeries = `${series[0]}-${series[1]}`;
    this.packageId = model.packageId;
    this.po = model.po;
    this.sku = model.sku || null;
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
    this.status = PKLItemStatus.Imported;
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
}
