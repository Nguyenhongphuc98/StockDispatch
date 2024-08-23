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

export type SubItemModel = {
  packageSeries: [number, number];
  grossWeight: number;
};

@Entity("SubItem")
export class SubItemEntity extends BaseRepository {
  @PrimaryGeneratedColumn()
  id: string;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @Column()
  @Index('IDX_SI_PKL')
  pklId: string;

  @ManyToOne(() => PackingListItemEntity, (pli) => pli.subitems)
  packingListItem: PackingListItemEntity;

  /**
   * sub box id, use for weigh
   */
  @Column()
  packageSeries: string;

  @Column()
  grossWeight: number;

  @Column({nullable: true})
  exportTime: Date;

  init(
    model: SubItemModel,
    packingListId: string,
    packingListItem: PackingListItemEntity
  ) {
    const series = model.packageSeries;

    this.packageSeries = `${series[0]}-${series[1]}`;

    this.pklId = packingListId;
    this.packingListItem = packingListItem;

    this.grossWeight = model.grossWeight;
  }

  toModel() {

    return {
      ...this,
      packageSeries: this.getPackageSeries(),
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

  getPackageSeries() {
    return [this.startSeries(), this.endSeries()]
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
