import { In, Not } from "typeorm";
import Logger from "../loger";
import { PackingListEntity } from "../persistense/packing-list";
import { PackingListItemEntity } from "../persistense/packling-list-item";
import { SubItemEntity } from "../persistense/sub-item";
import { bunddleSettings } from "../middleware/bundle-setting";
import { AppDataSource } from "../persistense/data-src";

const TAG = "[WLI]";

const DEFAULT_WEIGH = 0;

export class SubItemController {
  buildWeighItems(max: number, pklId: string, pklItem: PackingListItemEntity) {
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

  async createSubItems(
    pklId: string,
    pklItems: PackingListItemEntity[]
  ) {
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
      const WLIentities = pklItems
        .map((item) => {
          const maxBoxes = bunddleSettings.boxesAmount(item.packageId);
          return this.buildWeighItems(maxBoxes, pklId, item);
        })
        .flat();

      await queryRunner.manager.save(SubItemEntity, WLIentities);
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

    return SubItemEntity.createQueryBuilder('subItem')
    .leftJoin('subItem.packingListItem', 'packingListItem')
    .select([
      'subItem.id',
      'subItem.packageSeries',
      'subItem.grossWeight',
      'packingListItem.id',   
      'packingListItem.packageSeries',
      'packingListItem.po',
      'packingListItem.packageId',
    ])
    .where('subItem.pklId = :pklId', { pklId })
    .getMany();
  }

  async markItemAsExported(sid: string) {
    return SubItemEntity.update(sid, {
      id: sid,
      exportTime: Date.now()
    });
  }

  async updateItemWeigh(sid: string, weigh: number) {
    return SubItemEntity.update(sid, {grossWeight: weigh});
  }
}

const subItemController = new SubItemController();
export default subItemController;
//'text/plain' host: '127.0.0.1',