import Logger from "../loger";
import { PackingListItemEntity } from "../persistense/packling-list-item";

const TAG = "[PKLIC]";

type AVGResult = { packingListItemId: string; avgGrossWeight: number };

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

    const avgResults: AVGResult[] = pklItems.map(v => {
      let totalBoxes = 0;
      let totalWeight = 0;
      v.subitems.forEach(sit => {
        const [start, end] = sit.packageSeries.split("-");
        const boxesCount = Number(end) - Number(start) + 1;

        totalBoxes+= boxesCount;
        totalWeight += (boxesCount * sit.grossWeight);
      });

      return {
        packingListItemId: v.id,
        avgGrossWeight: totalWeight / totalBoxes,
      }
    })
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
