import { In } from "typeorm";
import Logger from "../loger";
import { PackingListEntity, PKLStatus } from "../persistense/packing-list";
import { DataResult, SubmitExportItemModel } from "../utils/type";
import { ErrorCode } from "../utils/const";
import { UserEntity } from "../persistense/users";
import subItemController from "./subitem-controller";
import { SubItemEntity } from "../persistense/sub-item";
import socketMamanger from "../socket/socket-manager";
import aeswrapper from "../secure/aes";
import { ScannedItemData, ScannedItemStatus } from "../scanner/type";
import weighManager from "../manager/weigh-manager";
import packinglistController from "./packinglist-controller";
import pklItemController from "./pkl-item-controller";
import { PackingListItemEntity } from "../persistense/packling-list-item";

const TAG = "[WC]";

class WeighController {
  // PC==============================
  async startWeighSession(pklId: string) {
    const packinglist = await PackingListEntity.findOneBy({ id: pklId });

    if (!packinglist) {
      Logger.log(TAG, "create weigh session invalid pklid", pklId);

      const result: DataResult = {
        error_code: ErrorCode.ResourceNotFound,
        data: {
          pklId,
        },
      };
      return result;
    }

    await packinglistController.markPklAsWeighting(pklId);

    Logger.log(TAG, "startWeighSession success", pklId);

    weighManager.startSession(packinglist);

    const result: DataResult<PackingListEntity> = {
      error_code: ErrorCode.Success,
      data: packinglist,
    };
    return result;
  }

  async endWeighSession(pklId: string) {
    const packinglist = await PackingListEntity.findOneBy({ id: pklId });

    if (!packinglist) {
      Logger.log(TAG, "end weigh session invalid pklid", pklId);

      const result: DataResult = {
        error_code: ErrorCode.ResourceNotFound,
        data: {
          pklId,
        },
      };
      return result;
    }

    await pklItemController.updatePackingListItemGrossWeight(pklId);

    await packinglistController.markPklAsWeighFinished(pklId);

    Logger.log(TAG, "endWeighSession success", pklId);

    weighManager.endSession(packinglist.id);

    const result: DataResult<PackingListEntity> = {
      error_code: ErrorCode.Success,
      data: packinglist,
    };
    return result;
  }

  async updateFullWeighInfo(pklId: string, subId: string, weigh: number) {
    const subItem = await SubItemEntity.findOne({
      where: { id: subId },
      relations: ["packingListItem"],
    });

    if (!subItem) {
      Logger.log(TAG, "updateFullWeighInfo not found", pklId, subId);
      return;
    }

    subItem.grossWeight = weigh;
    await subItemController.updateItemWeigh(subId, weigh);

    // if (subItem.packingListItem.grossWeight) {
      const pklItem = await PackingListItemEntity.findOne({
        where: {
          id: subItem.packingListItem.id,
        },
        relations: ["subitems"]
      });

      let totalWeigh = 0;
      pklItem.subitems.forEach(sit => {
        totalWeigh+=sit.grossWeight;
      });

      pklItem.grossWeight = totalWeigh;
      await pklItem.save();

      //@ts-ignore
      pklItem.subitems = [pklItem.subitems.map(v => v.id)];
      subItem.packingListItem = pklItem;
      Logger.log(TAG, "updateFullWeighInfo => update item weigh", pklId, subId, totalWeigh);
    // }

    const data = {
      status: ScannedItemStatus.Success,
      sessionId: pklId,
      info: subItem,
    };

    socketMamanger.broasdcast("weigh", data);

    Logger.log(TAG, "weigh full item success", pklId, subId, weigh);

    const result: DataResult<ScannedItemData> = {
      error_code: ErrorCode.Success,
      data: data,
    };

    return result;
  }

  // Mobile==============================
  async getWeighItemInfo(pklId: string, cipherData: any) {
    if (!weighManager.doesSessionExists(pklId)) {
      const result: DataResult<ScannedItemData> = {
        error_code: ErrorCode.SessionNotFound,
        message: "The weigh session is not running",
        data: {
          status: ScannedItemStatus.NoSession,
          sessionId: pklId,
          info: {},
        },
      };
      Logger.log(TAG, "scanned item no session", pklId);
      return result;
    }

    const weighKey = weighManager.getKey(pklId);
    const { subId } = aeswrapper.decryptUseKey(weighKey, cipherData);

    Logger.log(TAG, "getWeighItemInfo", pklId, subId);

    const subItem = await SubItemEntity.findOne({
      where: { id: subId },
      relations: ["packingListItem"],
    });

    if (!subItem) {
      const data = {
        status: ScannedItemStatus.ItemNotFound,
        sessionId: pklId,
        info: {},
      };

      const result: DataResult<string> = {
        error_code: ErrorCode.ResourceNotFound,
        message: "resource not found",
        data: aeswrapper.encryptUseKey<ScannedItemData>(weighKey, data),
      };

      //   socketMamanger.broasdcast('export', data);

      Logger.log(TAG, "scanned item item not found", pklId, subId);
      return result;
    }

    const subItemFullInfo: ScannedItemData["info"] = {
      id: subItem.id,
      packageId: subItem.packingListItem.packageId,
      packageSeries: subItem.getPackageSeries(),
      po: subItem.packingListItem.po,
      sku: subItem.packingListItem.sku,
      itemsInPackage: subItem.packingListItem.itemsInPackage,
      netWeight: subItem.packingListItem.netWeight,
      grossWeight: subItem.grossWeight,
      width: subItem.packingListItem.width,
      length: subItem.packingListItem.length,
      height: subItem.packingListItem.height,
    };

    if (subItem.pklId !== pklId) {
      const data = {
        status: ScannedItemStatus.InvalidItem,
        sessionId: pklId,
        info: subItemFullInfo,
      };
      const result: DataResult<string> = {
        error_code: ErrorCode.Success,
        message: "item not in session",
        data: aeswrapper.encryptUseKey<ScannedItemData>(weighKey, data),
      };

      //   socketMamanger.broasdcast('export', data);

      Logger.log(TAG, "scanned item invalid item", pklId, subId);
      return result;
    }

    if (subItem.grossWeight) {
      const data = {
        status: ScannedItemStatus.Duplicate,
        sessionId: pklId,
        info: subItemFullInfo,
      };

      const result: DataResult<string> = {
        error_code: ErrorCode.Success,
        message: "scan duplicate item",
        data: aeswrapper.encryptUseKey<ScannedItemData>(weighKey, data),
      };

      //   socketMamanger.broasdcast('export', data);

      Logger.log(TAG, "scanned item dup item", pklId, subId);
      return result;
    }

    const data = {
      status: ScannedItemStatus.Success,
      sessionId: pklId,
      info: subItemFullInfo,
    };

    const result: DataResult<string> = {
      error_code: ErrorCode.Success,
      message: "scan item success",
      data: aeswrapper.encryptUseKey<ScannedItemData>(weighKey, data),
    };

    // socketMamanger.broasdcast("export", data);

    Logger.log(TAG, "scanned item success", pklId, subId);
    return result;
  }

  async updateWeighInfo(pklId: string, cipherData: any) {
    if (!weighManager.doesSessionExists(pklId)) {
      const result: DataResult<ScannedItemData> = {
        error_code: ErrorCode.SessionNotFound,
        message: "The weigh session is not running",
        data: {
          status: ScannedItemStatus.NoSession,
          sessionId: pklId,
          info: {},
        },
      };
      Logger.log(TAG, "weigh item no session", pklId);
      return result;
    }

    const weighKey = weighManager.getKey(pklId);
    const { subId, weigh } = aeswrapper.decryptUseKey(weighKey, cipherData);

    if (!subId) {
      const data = {
        status: ScannedItemStatus.ItemNotFound,
        sessionId: pklId,
        info: {},
      };

      const result: DataResult<string> = {
        error_code: ErrorCode.ResourceNotFound,
        message: "Invalid subId: " + subId,
        data: aeswrapper.encryptUseKey<ScannedItemData>(weighKey, data),
      };

      return result;
    }

    const subItem = await SubItemEntity.findOne({
      where: { id: subId },
    });

    if (!subItem) {
      const data = {
        status: ScannedItemStatus.ItemNotFound,
        sessionId: pklId,
        info: {},
      };

      const result: DataResult<string> = {
        error_code: ErrorCode.ResourceNotFound,
        message: "weigh item not found",
        data: aeswrapper.encryptUseKey<ScannedItemData>(weighKey, data),
      };

      return result;
    }

    if (subItem.pklId !== pklId) {
      Logger.log(TAG, "weighItem invalid pkl", pklId, subId, subItem.pklId);

      const data = {
        status: ScannedItemStatus.InvalidItem,
        sessionId: pklId,
        info: {},
      };
      const result: DataResult<string> = {
        error_code: ErrorCode.Success,
        message: "weigh item not in session",
        data: aeswrapper.encryptUseKey<ScannedItemData>(weighKey, data),
      };

      //   socketMamanger.broasdcast('export', data);

      Logger.log(TAG, "weigh item invalid item", pklId, subId);
      return result;
    }

    await subItemController.updateItemWeigh(subId, weigh);

    const data = {
      status: ScannedItemStatus.Success,
      sessionId: pklId,
      info: subItem,
    };
    const result: DataResult<string> = {
      error_code: ErrorCode.Success,
      message: "update weight item success",
      data: aeswrapper.encryptUseKey<ScannedItemData>(weighKey, data),
    };

    socketMamanger.broasdcast("weigh", data);

    Logger.log(TAG, "weigh item success", pklId, subId);
    return result;
  }

  async getWeighFullInfo(pklId: string) {
    const pklEntity = await PackingListEntity.getByIdWithCreateBy(pklId);

    if (!pklEntity) {
      const result: DataResult = {
        error_code: ErrorCode.ResourceNotFound,
        data: {
          pklId,
        },
      };
      return result;
    }

    if (!(await subItemController.createSubItemsIfNotExists(pklId))) {
      const result: DataResult = {
        error_code: ErrorCode.Error,
        data: {},
      };
      return result;
    }

    const totalWeighItem = await subItemController.countAll([pklId]);
    const weighedItem = await subItemController.countWeighed([pklId]);

    const result: DataResult = {
      error_code: ErrorCode.Success,
      data: {
        ...pklEntity,
        itemsCount: totalWeighItem,
        weighedCount: weighedItem,
      },
    };
    return result;
  }
}

const weighController = new WeighController();
export default weighController;
