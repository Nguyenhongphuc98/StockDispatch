import { PackingListEntity } from "../persistense/packing-list";
import { PackingListItemEntity } from "../persistense/packling-list-item";
import Logger from "../loger";
import { SubItemEntity } from "../persistense/sub-item";

const TAG = "PKLC";

class PackingListController {
  constructor() {}

  async deletePackinglistAndRelation(pklId: string) {
    try {
      await SubItemEntity.delete({ pklId: pklId});

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
}

const packinglistController = new PackingListController();
export default packinglistController;
