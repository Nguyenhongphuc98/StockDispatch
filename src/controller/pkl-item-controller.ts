import { In, Not } from "typeorm";
import Logger from "../loger";
import { PackingListEntity } from "../persistense/packing-list";
import { PackingListItemEntity } from "../persistense/packling-list-item";
import { SubItemEntity } from "../persistense/sub-item";
import { bunddleSettings } from "../middleware/bundle-setting";
import { AppDataSource } from "../persistense/data-src";

const TAG = "[PKLIC]";

type AVGResult = { packingListItemId: string; avgGrossWeight: number };

export class PKLItemController {
  async updatePackingListItemGrossWeight(packingListId: number) {
    const subItemAvgQuery = `
       	SELECT
  			pli.id AS packingListItemId,
  			AVG(si.grossWeight) AS avgGrossWeight
		FROM
  			PackingListItem pli
		JOIN
  			SubItem si ON pli.id = si.packingListItemId
		WHERE
  			pli.packingListId = ?
		GROUP BY
  			pli.id
        `;

    const avgResults: AVGResult[] = await SubItemEntity.query(subItemAvgQuery, [packingListId]);
    const loginfos = avgResults.map(
      (v) => `id: ${v.packingListItemId} value: ${v.avgGrossWeight}`
    );

    Logger.log(TAG, "do update avg for", packingListId, avgResults, loginfos);

    for (let i = 0; i < avgResults.length; i++) {
      const { packingListItemId, avgGrossWeight } = avgResults[i];
      await PackingListItemEntity.update(packingListItemId, {
        grossWeight: avgGrossWeight,
      });
    }
  }
}

const pklItemController = new PKLItemController();
export default pklItemController;
