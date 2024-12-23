import { In, Not } from "typeorm";
import Logger from "../loger";
import { PackingListEntity } from "../persistense/packing-list";
import { PackingListItemEntity } from "../persistense/packling-list-item";
import { SubItemEntity } from "../persistense/sub-item";
import { bunddleSettings } from "../middleware/bundle-setting";
import { AppDataSource } from "../persistense/data-src";
import systemTime from "../utils/system-time";

const TAG = "[SIC]";

const DEFAULT_WEIGH = 0;

export class SubItemController {
  buildSubItems(max: number, pklId: string, pklItem: PackingListItemEntity) {
    const results: SubItemEntity[] = [];
    const start = pklItem.startSeries();
    const end = pklItem.endSeries();

    let s = start;
    while (s <= end) {
      let e = Math.min(s + max - 1, end);
      const subItem = new SubItemEntity();
      subItem.init(
        {
          packageSeries: [s, e],
          grossWeight: DEFAULT_WEIGH,
        },
        pklId,
        pklItem
      );
      results.push(subItem);
      s = e + 1;
    }

    return results;
  }

  async anyItem(pklId: string): Promise<boolean> {
    const entity = await SubItemEntity.findOneBy({
      pklId: pklId,
    });

    return !!entity;
  }

  async countAll(pklIds: string[]) {
    return SubItemEntity.countBy({
      pklId: In(pklIds),
    });
  }

  async countWeighed(pklIds: string[]) {
    return SubItemEntity.countBy({
      pklId: In(pklIds),
      grossWeight: Not(DEFAULT_WEIGH),
    });
  }

  async countExported(pklIds: string[]) {
    return SubItemEntity.countBy({
      pklId: In(pklIds),
      exportTime: Not(null),
    });
  }

  async totalExportedVolume(pklIds: string[]) {
    const totalVolume = await SubItemEntity.createQueryBuilder("subItem")
      .innerJoin(
        "subItem.packingListItem",
        "pkli",
        "subItem.packingListItemId = pkli.id"
      )
      .where("subItem.exportTime IS NOT NULL")
      .andWhere("subItem.pklId IN (:...pklIds)", { pklIds })
      .select(
        `SUM(pkli.width * pkli.length * pkli.height * (
          CAST(SUBSTR(subItem.packageSeries, INSTR(subItem.packageSeries, '-') + 1) AS INTEGER) -
          CAST(SUBSTR(subItem.packageSeries, 1, INSTR(subItem.packageSeries, '-') - 1) AS INTEGER) + 1
        )) `,
        "totalVolume"
      )
      .getRawOne();
      // console.log('aaa', totalVolume);

    return totalVolume.totalVolume || 0;
  }

  async createSubItemsIfNotExists(pkl: string) {
    const created = await this.anyItem(pkl);
    if (!created) {
      try {
        const pklEntity = await PackingListEntity.findOne({
          where: {
            id: pkl,
          },
        });

        if (!pklEntity) {
          Logger.log(TAG, "create subItem not found pkl");
          return false;
        }

        const pklItemEntities = await PackingListItemEntity.find({
          where: { packingList: { id: pkl } },
        });

        await this.createSubItems(pklEntity.id, pklItemEntities);
        return true;
      } catch (error) {
        Logger.error(TAG, "create subItem err", error);
        return false;
      }
    }

    return true;
  }

  async createSubItems(pklId: string, pklItems: PackingListItemEntity[]) {
    Logger.log(
      TAG,
      "createSubItems",
      pklId,
      pklItems.map((v) => v.id)
    );

    const queryRunner = AppDataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const SubItemEntities = pklItems
        .map((item) => {
          const maxBoxes = bunddleSettings.boxesAmount(item.po);
          return this.buildSubItems(maxBoxes, pklId, item);
        })
        .flat();

      await queryRunner.manager.save(SubItemEntity, SubItemEntities);
      await queryRunner.commitTransaction();
    } catch (error) {
      Logger.error(
        TAG,
        "createSubItems fail",
        pklItems[0]?.packingList.id,
        pklItems.map((v) => v.id),
        error
      );
      await queryRunner.release();
      await queryRunner.rollbackTransaction();

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getSubitemsOfPkl(pklId: string) {
    // const subItems = await SubItemEntity.find({ where: { pklId } , relations: ['packingListItem']});
    // return subItems;

    const subItems = await SubItemEntity.createQueryBuilder("subItem")
      .leftJoin("subItem.packingListItem", "packingListItem")
      .select([
        "subItem.id",
        "subItem.packageSeries",
        "subItem.grossWeight",
        "subItem.exportTime",
        "packingListItem.id",
        "packingListItem.packageSeries",
        "packingListItem.po",
        "packingListItem.packageId",
      ])
      .where("subItem.pklId = :pklId", { pklId })
      .getMany();

    Logger.log(
      TAG,
      "getSubitemsOfPkl",
      pklId
    );
    return subItems;
  }

  async markItemAsExported(sid: string) {
    Logger.log(TAG, "markItemAsExported", sid);
    return SubItemEntity.update(sid, {
      id: sid,
      exportTime: systemTime.date(),
    });
  }

  async updateItemWeigh(sid: string, weigh: number) {
    Logger.log(TAG, "updateItemWeigh", sid, weigh);
    return SubItemEntity.update(sid, {
      id: sid,
      grossWeight: weigh,
    });
  }
}

const subItemController = new SubItemController();
export default subItemController;
//'text/plain' host: '127.0.0.1',
