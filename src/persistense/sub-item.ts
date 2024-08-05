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

export type WeighListItemModel = {
  packageSeries: [number, number];
  parentPackageSeries: [number, number];
  grossWeight: number;
};

@Entity("SubItem")
@Index('IDX_SI_PKL', ['packingList'])
export class SubItemEntity extends BaseRepository {
  @PrimaryGeneratedColumn()
  id: string;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @ManyToOne(() => PackingListEntity, (pl) => pl.items)
  packingList: PackingListEntity;

  @ManyToOne(() => PackingListItemEntity, (pli) => pli.weighList)
  packingListItem: PackingListItemEntity;

  /**
   * sub box id, use for weigh
   */
  @Column()
  packageSeries: string;

  /**
   * id map to packling list
   */
  @Column()
  parentPackageSeries: string;

  @Column()
  grossWeight: number;

  @Column({nullable: true})
  exportTime: Date;

  init(
    model: WeighListItemModel,
    packingList: PackingListEntity,
    packingListItem: PackingListItemEntity
  ) {
    const series = model.packageSeries;
    const parentSeries = model.parentPackageSeries;

    this.packageSeries = `${series[0]}-${series[1]}`;
    this.parentPackageSeries = `${parentSeries[0]}-${parentSeries[1]}`;

    this.packingList = packingList;
    this.packingListItem = packingListItem;

    this.grossWeight = model.grossWeight;
  }

  toModel() {
    const parsedParentSeries = this.parentPackageSeries.split("-");
    const _parentPackageSeries = [parsedParentSeries[0], parsedParentSeries[1]];

    return {
      ...this,
      packageSeries: [this.startSeries(), this.endSeries()],
      parentPackageSeries: _parentPackageSeries,
    };
  }

  startSeries() {
    const parsedSeries = this.packageSeries.split("-");
    return parsedSeries[0];
  }

  endSeries() {
    const parsedSeries = this.packageSeries.split("-");
    return parsedSeries[1];
  }
}

// function t(
//     max,
//     start,
//     end,
//   ) {

//     let s = start;
//     while (s <= end) {
//       let e = Math.min(s + max, end);
//       console.log([s, e]);
//       s = e+1;
//     }
//   }
