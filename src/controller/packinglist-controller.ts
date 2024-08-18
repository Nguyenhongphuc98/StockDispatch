import { PackingListEntity, WeighStatus } from "../persistense/packing-list";
import { PackingListItemEntity } from "../persistense/packling-list-item";
import Logger from "../loger";
import { SubItemEntity } from "../persistense/sub-item";

const TAG = "PKLC";

class PackingListController {
  constructor() {}

  async deletePackinglistAndRelation(pklId: string) {
    try {
      await SubItemEntity.delete({ pklId: pklId });

      const packingList = await PackingListEntity.findOne({
        where: { id: pklId },
        relations: ["items"],
      });

      if (!packingList) {
        Logger.log(TAG, "Call delete for not exists pkl", pklId);
        return false;
      }

      await PackingListEntity.remove(packingList);
    } catch (error) {
      Logger.log(TAG, "Delete pkl err", pklId, error);
      return false;
    }

    return true;
  }

  async markPklAsWeighting(pklId: string) {
    return PackingListEntity.update(pklId, {
      weighStatus: WeighStatus.Weighting,
    });
  }

  async markPklAsWeighFinished(pklId: string) {
    return PackingListEntity.update(pklId, {
      weighStatus: WeighStatus.Finished,
    });
  }

  async getTotalBoxes(pklIds: string[]) {
    const countBoxesQuery = `
    SELECT
      SUM(
        CAST(SUBSTR(packageSeries, INSTR(packageSeries, '-') + 1) AS INTEGER) -
        CAST(SUBSTR(packageSeries, 1, INSTR(packageSeries, '-') - 1) AS INTEGER) + 1
      ) AS totalBoxes
    FROM PackingListItem
    WHERE packingListId IN (${pklIds.map(() => "?").join(", ")})
  `;

    const boxCountResult = await PackingListItemEntity.query(
      countBoxesQuery,
      pklIds
    );
    const totalBoxes = Number(boxCountResult[0].totalBoxes);

    return totalBoxes;
  }

  async getTotalVolume(pklIds: string[]) {
    const volumeQuery = `
    SELECT
      SUM(
        (width * height * length) * (
          CAST(SUBSTR(packageSeries, INSTR(packageSeries, '-') + 1) AS INTEGER) -
          CAST(SUBSTR(packageSeries, 1, INSTR(packageSeries, '-') - 1) AS INTEGER) + 1
        )
      ) AS totalVolume
    FROM PackingListItem
    WHERE packingListId IN (${pklIds.map(() => "?").join(", ")})
  `;

    const volumeResult = await PackingListItemEntity.query(volumeQuery, pklIds);
    const totalVolume = Number(volumeResult[0].totalVolume);

    return totalVolume;
  }

  async getTotaPCS(pklIds: string[]) {
    const itemsInPackageQuery = `
    SELECT
      SUM(
        itemsInPackage * (
          CAST(SUBSTR(packageSeries, INSTR(packageSeries, '-') + 1) AS INTEGER) -
          CAST(SUBSTR(packageSeries, 1, INSTR(packageSeries, '-') - 1) AS INTEGER) + 1
        )
      ) AS totalItemsInPackage
    FROM PackingListItem
    WHERE packingListId IN (${pklIds.map(() => "?").join(", ")})
  `;

    const itemsInPackageResult = await PackingListItemEntity.query(
      itemsInPackageQuery,
      pklIds
    );
    const totalItemsInPackage = Number(
      itemsInPackageResult[0].totalItemsInPackage
    );

    return totalItemsInPackage;
  }
}

const packinglistController = new PackingListController();
export default packinglistController;
