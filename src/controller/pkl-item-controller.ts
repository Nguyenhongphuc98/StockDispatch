import Logger from "../loger";
import { PackingListItemEntity } from "../persistense/packling-list-item";

const TAG = "[PKLIC]";

type AVGResult = { packingListItemId: string; avgGrossWeight: number };
type TotalResult = { packingListItemId: string; totalGrossWeight: number };

export class PKLItemController {
  async updatePackingListItemGrossWeight(packingListId: string) {
    // const subItemAvgQuery = `
    //    	SELECT
  	// 		pli.id AS packingListItemId,
  	// 		AVG(si.grossWeight) AS avgGrossWeight
		// FROM
  	// 		PackingListItem pli
		// JOIN
  	// 		SubItem si ON pli.id = si.packingListItemId
		// WHERE
  	// 		pli.packingListId = ?
		// GROUP BY
  	// 		pli.id
    //     `;


    // const avgResults: AVGResult[] = await SubItemEntity.query(subItemAvgQuery, [packingListId]);

    const pklItems = await PackingListItemEntity.find({
      where: {
        packingList: {id: packingListId},
      },
      relations: ["subitems"]
    });

    const totalResults: TotalResult[] = pklItems.map(v => {
      let totalWeight = 0;
      v.subitems.forEach(sit => {
        totalWeight += sit.grossWeight;
      });

      return {
        packingListItemId: v.id,
        totalGrossWeight: totalWeight,
      }
    })
    const loginfos = totalResults.map(
      (v) => `id: ${v.packingListItemId} value: ${v.totalGrossWeight}`
    );

    Logger.log(TAG, "do update total for", packingListId, totalResults, loginfos);

    for (let i = 0; i < totalResults.length; i++) {
      const { packingListItemId, totalGrossWeight } = totalResults[i];
      await PackingListItemEntity.update(packingListItemId, {
        grossWeight: totalGrossWeight,
      });
    }
  }
}

const pklItemController = new PKLItemController();
export default pklItemController;
