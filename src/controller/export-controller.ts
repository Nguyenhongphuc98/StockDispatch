import { In } from "typeorm";
import exportManager from "../export/export-manager";
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
      const result: DataResult = {
        error_code: ErrorCode.Success,
        data: exportItem,
      };
      return result;
    } else {
      const result: DataResult = {
        error_code: ErrorCode.Error,
        data: {},
      };
      return result;
    }
  }

  async exportItem(sessionId: string, submitItemModel: SubmitExportItemModel) {
    const subItem = await SubItemEntity.findOneBy({
      id: submitItemModel.subId,
    });

    if (!subItem) {
      const result: DataResult = {
        error_code: ErrorCode.ResourceNotFound,
        message: 'resource not found',
        data: {},
      };
      return result;
    }

    if (!exportManager.doesSessionExists(submitItemModel.eId)) {
      const result: DataResult = {
        error_code: ErrorCode.SessionNotFound,
        message: 'The export session is not running',
        data: {},
      };
      return result;
    }

    return subItemController
      .markItemAsExported(submitItemModel.subId)
      .then((_) => {

        // Send data to all PC
        socketMamanger.broasdcast("export", aeswrapper.encrypt(sessionId, subItem));

        // Return data to mobile req
        const key = exportManager.getKey(submitItemModel.eId);
        const result: DataResult = {
          error_code: ErrorCode.Success,
          message: 'success',
          data: aeswrapper.encryptUseKey(key, subItem),
        };
        return result;
      })
      .catch((e) => {
        Logger.log(TAG, "export item err", e);
        const result: DataResult = {
          error_code: ErrorCode.Error,
          message: 'export item err',
          data: {},
        };
        return result;
      });
  }
}

const exportController = new ExportController();
export default exportController;
