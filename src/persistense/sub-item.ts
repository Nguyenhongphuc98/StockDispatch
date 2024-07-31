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

const DEFAULT_WEIGH = 0;

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

  static buildWeighItems(
    max: number,
    pkl: PackingListEntity,
    pklItem: PackingListItemEntity
  ) {
    const results: SubItemEntity[] = [];
    const start = pklItem.startSeries();
    const end = pklItem.endSeries();

    let s = start;
    while (s <= end) {
      let e = Math.min(s + max - 1, end);
      const weighItem = new SubItemEntity();
      weighItem.init(
        {
          packageSeries: [s, e],
          parentPackageSeries: [pklItem.startSeries(), pklItem.endSeries()],
          grossWeight: DEFAULT_WEIGH,
        },
        pkl,
        pklItem
      );
      results.push(weighItem);
      s = e + 1;
    }

    return results;
  }

  static async anyItem(pklId: string): Promise<boolean> {
    const entity = await SubItemEntity.findOneBy({
      packingList: {
        id: pklId,
      },
    });

    return !!entity;
  }

  static async countAll(pklIds: string[]) {
    return SubItemEntity.countBy({
      packingList: {
        id: In(pklIds),
      },
    });
  }

  static async countWeighed(pklIds: string[]) {
    return SubItemEntity.countBy({
      packingList: {
        id: In(pklIds),
      },
      grossWeight: Not(DEFAULT_WEIGH)
    });
  }

  static async countExported(pklIds: string[]) {
    return SubItemEntity.countBy({
      packingList: {
        id: In(pklIds),
      },
      exportTime: Not(null)
    });
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
