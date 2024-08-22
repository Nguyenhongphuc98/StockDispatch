import { In } from "typeorm";
import exportManager from "../manager/export-manager";
import Logger from "../loger";
import { ExportEntity, ExportModel, ExportStatus } from "../persistense/export";
import { PackingListEntity, PKLStatus } from "../persistense/packing-list";
import { DataResult, SubmitExportItemModel } from "../utils/type";
import { ErrorCode } from "../utils/const";
import { UserEntity } from "../persistense/users";
import subItemController from "./subitem-controller";
import { SubItemEntity } from "../persistense/sub-item";
import socketMamanger from "../socket/socket-manager";
import aeswrapper from "../secure/aes";
import { ScannedItemData, ScannedItemStatus } from "../scanner/type";
import { PackingListItemEntity } from "../persistense/packling-list-item";
import packinglistController from "./packinglist-controller";
import systemTime from "../utils/system-time";

const TAG = "[EC]";

class ExportController {
  async startExportSession(
    pklIds: string[],
    model: ExportModel,
    user: UserEntity
  ) {
    const packinglists = await PackingListEntity.findBy({ id: In(pklIds) });

    if (packinglists.length < pklIds.length) {
      const invalidIds = pklIds.filter((id) => {
        return !packinglists.some((p) => p.id == id);
      });

      Logger.log(TAG, "create export invalid pklids", invalidIds);

      const result: DataResult = {
        error_code: ErrorCode.ResourceNotFound,
        data: {
          invalidIds,
        },
      };
      return result;
    }

    const exportItem = new ExportEntity();
    exportItem.init(model, user, packinglists);

    const missFields = exportItem.getMissingFields();
    if (missFields.length) {
      Logger.log(TAG, "create export miss field", missFields);
      const result: DataResult = {
        error_code: ErrorCode.InvalidPayload,
        data: { missFields },
      };
      return result;
    }

    for (const pid of pklIds) {
      if (!(await subItemController.createSubItemsIfNotExists(pid))) {
        const result: DataResult = {
          error_code: ErrorCode.Error,
          data: { message: "fail to init sub items" },
        };
        return result;
      }
    }

    for (let i = 0; i < packinglists.length; i++) {
      const p = packinglists[i];
      p.status = PKLStatus.Exporting;
      await p.save();
    }

    const success = await exportItem
      .save()
      .then((_) => true)
      .catch((e) => {
        Logger.log(TAG, "create export err", pklIds, e);
        return false;
      });

    if (success) {
      exportManager.startSession(exportItem);
      Logger.log(TAG, "create export success", pklIds, exportItem.id);
      const result: DataResult = {
        error_code: ErrorCode.Success,
        data: exportItem,
      };
      return result;
    } else {
      const result: DataResult = {
        error_code: ErrorCode.Error,
        data: { message: "create export error" },
      };
      return result;
    }
  }

  async endExportSession(eid: string) {
    const exportItem = await ExportEntity.findOneBy({ id: eid });

    if (!exportItem) {
      Logger.log(TAG, "Call end export not exists export item", eid);
      const result: DataResult = {
        error_code: ErrorCode.ResourceNotFound,
        data: {},
      };
      return result;
    }

    exportItem.status = ExportStatus.Exported;
    const success = await exportItem
      .save()
      .then((_) => true)
      .catch((e) => {
        Logger.log(TAG, "Update export status got error", eid, e);
        return false;
      });

    if (success) {
      exportManager.endSession(exportItem.id);
      Logger.log(TAG, "end export success", eid);
      const result: DataResult = {
        error_code: ErrorCode.Success,
        data: exportItem,
      };
      return result;
    } else {
      Logger.error(TAG, "end export err", eid);
      const result: DataResult = {
        error_code: ErrorCode.Error,
        data: {},
      };
      return result;
    }
  }

  async exportItem(exportId: string, cipherData: any) {
    const exportKey = exportManager.getKey(exportId);
    const { subId } = aeswrapper.decryptUseKey(exportKey, cipherData);

    Logger.log(TAG, "exportItem", exportId, subId);

    if (!exportManager.doesSessionExists(exportId)) {
      const result: DataResult<ScannedItemData> = {
        error_code: ErrorCode.SessionNotFound,
        message: "The export session is not running",
        data: {
          status: ScannedItemStatus.NoSession,
          sessionId: exportId,
          info: {},
        },
      };
      Logger.log(TAG, "exportItem no session", exportId, subId);
      return result;
    }

    const subItem = await SubItemEntity.findOne({
      where: { id: subId },
      relations: ["packingListItem"],
    });

    if (!subItem || !subId) {
      const data = {
        status: ScannedItemStatus.ItemNotFound,
        sessionId: exportId,
        info: {},
      };

      const result: DataResult<string> = {
        error_code: ErrorCode.ResourceNotFound,
        message: "resource not found",
        data: aeswrapper.encryptUseKey<ScannedItemData>(exportKey, data),
      };

      socketMamanger.broasdcast("export", data);

      Logger.log(TAG, "exportItem item not found", exportId, subId);
      return result;
    }

    const subItemFullInfo: ScannedItemData["info"] = {
      id: subItem.id,
      packageId: subItem.packingListItem.packageId,
      packageSeries: subItem.packageSeries,
      po: subItem.packingListItem.po,
      sku: subItem.packingListItem.sku,
      itemsInPackage: subItem.packingListItem.itemsInPackage,
      netWeight: subItem.packingListItem.netWeight,
      grossWeight: subItem.grossWeight,
      width: subItem.packingListItem.width,
      length: subItem.packingListItem.length,
      height: subItem.packingListItem.height,
      exportTime: systemTime.now(),
    };

    const pklids = exportManager.getPackinglistIds(exportId);

    if (!pklids.includes(subItem.pklId)) {
      Logger.log(
        TAG,
        "exportItem invalid pkl",
        exportId,
        subId,
        pklids,
        subItem.pklId
      );

      const data = {
        status: ScannedItemStatus.InvalidItem,
        sessionId: exportId,
        info: subItemFullInfo,
      };
      const result: DataResult<string> = {
        error_code: ErrorCode.Success,
        message: "item not in session",
        data: aeswrapper.encryptUseKey<ScannedItemData>(exportKey, data),
      };

      socketMamanger.broasdcast("export", data);

      Logger.log(TAG, "exportItem invalid item", exportId, subId);
      return result;
    }

    if (subItem.exportTime) {
      const data = {
        status: ScannedItemStatus.Duplicate,
        sessionId: exportId,
        info: subItemFullInfo,
      };

      const result: DataResult<string> = {
        error_code: ErrorCode.Success,
        message: "scan duplicate item",
        data: aeswrapper.encryptUseKey<ScannedItemData>(exportKey, data),
      };

      socketMamanger.broasdcast("export", data);

      Logger.log(TAG, "exportItem dup item", exportId, subId);
      return result;
    }

    return subItemController
      .markItemAsExported(subId)
      .then((_) => {
        const data = {
          status: ScannedItemStatus.Success,
          sessionId: exportId,
          info: subItemFullInfo,
        };

        const result: DataResult<string> = {
          error_code: ErrorCode.Success,
          message: "scan item success",
          data: aeswrapper.encryptUseKey<ScannedItemData>(exportKey, data),
        };

        socketMamanger.broasdcast("export", data);

        Logger.log(TAG, "exportItem success", exportId, subId);
        return result;
      })
      .catch((e) => {
        Logger.log(TAG, "export item err", e);

        const result: DataResult<string> = {
          error_code: ErrorCode.Error,
          message: "export item err",
          data: aeswrapper.encryptUseKey<ScannedItemData>(exportKey, {
            status: ScannedItemStatus.Error,
            sessionId: exportId,
            info: subItemFullInfo,
          }),
        };
        return result;
      });
  }

  async getByIdWithFullData(exportId: string) {
    const exportItem: ExportEntity & Record<string, any> =
      await ExportEntity.createQueryBuilder("e")
        .leftJoin("e.createdBy", "User")
        .addSelect(["User.displayName", "User.username"])
        .where("e.id = :id", { id: exportId })
        .leftJoinAndSelect("e.items", PackingListItemEntity.name)
        .getOne();

    if (exportItem) {
      const pklIds = exportItem.items.map((it) => it.id);

      exportItem.subItemsCount = await this.countTotalExportItems(exportItem);
      exportItem.exportedCount = await this.countExportedItems(exportItem);
      exportItem.boxesCount = await packinglistController.getTotalBoxes(pklIds);
      exportItem.totalPCS = await packinglistController.getTotaPCS(pklIds);
      exportItem.totalVolume = await packinglistController.getTotalVolume(
        pklIds
      );
    }

    Logger.log(TAG, "getByIdWithFullData", exportItem?.id);

    return exportItem;
  }

  async countTotalExportItems(exportItem: ExportEntity) {
    const pklIds = exportItem.items.map((i) => i.id);
    const totalCount = await subItemController.countAll(pklIds);

    Logger.log(TAG, "countTotalExportItems", totalCount);
    return totalCount;
  }

  async countExportedItems(exportItem: ExportEntity) {
    const pklIds = exportItem.items.map((i) => i.id);
    const totalCount = await subItemController.countExported(pklIds);

    Logger.log(TAG, "countExportedItems", totalCount);
    return totalCount;
  }
}

const exportController = new ExportController();
export default exportController;
