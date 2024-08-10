import { ExportEntity, ExportStatus } from "../persistense/export";
import { PackingListEntity, WeighStatus } from "../persistense/packing-list";
import aeswrapper from "../secure/aes";
import { ErrorCode } from "../utils/const";
import { ConnectScannerStatus, ExportedItemStatus } from "./type";

function buildResp(
  status: ConnectScannerStatus,
  key: string = null,
  info: any = {}
) {
  let data: any = {
    status: status,
    info: info,
  };

  if (key) {
    data = aeswrapper.encryptUseKey(key, data);
  }

  const resp = {
    error_code: ErrorCode.Success,
    data: data,
  };
  return resp;
}

function buildNoSessionResp(data: any = {}) {
  const resp = {
    error_code: ErrorCode.SessionNotFound,
    data: {
      status: ConnectScannerStatus.NoSession,
      info: data,
    },
  };

  return resp;
}

class ScanController {
  constructor() {}

  async connect({ wid, eid }: { wid: string; eid: string }) {
    if (!wid && !eid) {
      return buildNoSessionResp();
    }

    if (eid) {
      const exportInfo = await this.getExportInfo(eid);

      if (!exportInfo) {
        return buildNoSessionResp();
      }

      return buildResp(ConnectScannerStatus.Success, exportInfo.key, {
        channelName: exportInfo.name,
      });
    }

    if (wid) {
      const weighInfo = await this.getWeighInfo(wid);

      if (!weighInfo) {
        return buildResp(ConnectScannerStatus.NoSession);
      }

      return buildResp(
        ConnectScannerStatus.Success,
        weighInfo.weighKey,
        weighInfo.name
      );
    }
  }

  private async getExportInfo(eid: string) {
    const exportItem = await ExportEntity.findOneBy({
      id: eid,
      status: ExportStatus.Exporting,
    });

    return exportItem;
  }

  private async getWeighInfo(wid: string) {
    const weighItem = await PackingListEntity.findOneBy({
      id: wid,
      weighStatus: WeighStatus.Weighting,
    });

    return weighItem;
  }
}

const scanController = new ScanController();

export default scanController;