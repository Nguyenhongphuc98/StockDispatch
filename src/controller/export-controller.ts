import { Between, In } from "typeorm";
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
    const exportItem = await ExportEntity.findOne({
      where: { id: eid },
      relations: ['items'],
    });

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
      for (let i = 0; i < exportItem.items.length; i++) {
        const pkl = exportItem.items[i];
        pkl.status = PKLStatus.Exported;
        await pkl.save();
      }

      Logger.log(TAG, "end export success", eid, exportItem.items.map(pkl => pkl.id));

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

  async deleteExport(eid: string) {
    const exportItem = await ExportEntity.findOne({
      where: { id: eid },
      relations: ['items'],
    });

    if (!exportItem) {
      Logger.log(TAG, "Call delete export not exists export item", eid);
      const result: DataResult = {
        error_code: ErrorCode.ResourceNotFound,
        data: {},
      };
      return result;
    }

    exportManager.endSession(exportItem.id);

    for (let i = 0; i < exportItem.items.length; i++) {
      const pkl = exportItem.items[i];
      pkl.export = null;
      await pkl.save();
    }

    await ExportEntity.delete(exportItem.id);

    Logger.log(TAG, "delete export success", eid, exportItem.items.map(pkl => pkl.id));

    const result: DataResult = {
      error_code: ErrorCode.Success,
      data: exportItem,
    };
    return result;
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
      packageSeries: subItem.getPackageSeries(),
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
      exportItem.exportedVolume = await this.countExportedVolume(exportItem);
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

  async countExportedVolume(exportItem: ExportEntity) {
    const pklIds = exportItem.items.map((i) => i.id);
    const exportedVolume = await subItemController.totalExportedVolume(pklIds);

    Logger.log(TAG, "countExportedVolume", exportedVolume);
    return exportedVolume;
  }

  async reportExportSumaryByDate(fromDate: Date, toDate: Date) {
    // const results = await ExportEntity.createQueryBuilder("export")
    //   .leftJoinAndSelect("export.items", "pkl")
    //   .leftJoin("pkl.items", "pkli")
    //   .where("export.createAt BETWEEN :fromDate AND :toDate", {
    //     fromDate,
    //     toDate,
    //   })
    //   .addSelect(
    //     `SUM(
    //   (
    //     CAST(SUBSTR(pkli.packageSeries, 0, INSTR(pkli.packageSeries, '-') - 1) AS INTEGER) -
    //     CAST(SUBSTR(pkli.packageSeries, INSTR(pkli.packageSeries, '-') + 1) AS INTEGER) + 1
    //   )
    // ) AS CTNS`
    //   )
    //   .addSelect(
    //     `SUM(
    //   (
    //     CAST(SUBSTR(pkli.packageSeries, 0, INSTR(pkli.packageSeries, '-') - 1) AS INTEGER) -
    //     CAST(SUBSTR(pkli.packageSeries, INSTR(pkli.packageSeries, '-') + 1) AS INTEGER) + 1
    //   ) * pkli.itemsInPackage
    // ) AS PCS`
    //   )
    //   .addSelect(
    //     `SUM(
    //   (pkli.width * pkli.height * pkli.length)
    // ) AS CBM`
    //   )
    //   .groupBy("export.id")
    //   .getRawMany();

    const exports = await ExportEntity.find({
      where: {
        createAt: Between(fromDate, toDate),
      },
      relations: ["items", "items.items"]
    });

    for (let i = 0; i < exports.length; i++) {
      const exportData = exports[i] as any;

      let CTNS = 0;
      let PCS = 0;
      let CBM = 0;

      exportData.items.forEach(pkl => {
        pkl.items.forEach(pkli => {
          const [start, end] = pkli.getPackageSeries();
          const ctns = (end - start + 1);

          CTNS += ctns;
          PCS += ctns * pkli.itemsInPackage;
          CBM += ctns * pkli.width * pkli.height * pkli.length;
        });

        delete pkl.items;
      });

      exportData.CTNS = CTNS;
      exportData.PCS = PCS;
      exportData.CBM = CBM;

      if (exportData.items.length) {
        exportData.inv = exportData.items[0].attachedInvoiceId;
      }

      delete exportData.items;
    }
    return exports;
  }

  async reportExportSumaryByCustomer(customer: string, fromDate: Date, toDate: Date) {
    const exports = await ExportEntity.find({
      where: {
        createAt: Between(fromDate, toDate),
        customer: customer
      },
      relations: ["items", "items.items"]
    });

    for (let i = 0; i < exports.length; i++) {
      const exportData = exports[i] as any;

      let CTNS = 0;
      let PCS = 0;
      let CBM = 0;

      exportData.items.forEach(pkl => {
        pkl.items.forEach(pkli => {
          const [start, end] = pkli.getPackageSeries();
          const ctns = (end - start + 1);

          CTNS += ctns;
          PCS += ctns * pkli.itemsInPackage;
          CBM += ctns * pkli.width * pkli.height * pkli.length;
        });

        delete pkl.items;
      });

      exportData.CTNS = CTNS;
      exportData.PCS = PCS;
      exportData.CBM = CBM;

      if (exportData.items.length) {
        exportData.inv = exportData.items[0].attachedInvoiceId;
      }

      delete exportData.items;
    }
    return exports;
  }
}

const exportController = new ExportController();
export default exportController;
