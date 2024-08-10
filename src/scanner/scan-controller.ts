import { ExportEntity, ExportStatus } from "../persistense/export";
import { PackingListEntity, WeighStatus } from "../persistense/packing-list";
import aeswrapper from "../secure/aes";
import { ErrorCode } from "../utils/const";
import { ConnectScannerStatus, ExportedItemStatus } from "./type";


function buildResp(status: ConnectScannerStatus, key: string = null, data: any = {}) {
  const resp = {
    error_code: ErrorCode.Success,
    data: {
      status: status,
      info: data
    },
  };

  if (key) {
    resp.data.info = aeswrapper.encryptUseKey(key, data);
  }
  
  return resp;
}

class ScanController {
    constructor() {
        
    }

    async connect({wid, eid}: {wid: string, eid: string}) {
      if (!wid || !eid) {
        return buildResp(ConnectScannerStatus.NoSession);
      }

      if (eid) {
        const exportInfo = await this.getExportInfo(eid);

        if (!exportInfo) {
          return buildResp(ConnectScannerStatus.NoSession);
        }

        return buildResp(ConnectScannerStatus.Success, exportInfo.key, exportInfo.name);
      }

      if (wid) {
        const weighInfo = await this.getWeighInfo(wid);

        if (!weighInfo) {
          return buildResp(ConnectScannerStatus.NoSession);
        }

        return buildResp(ConnectScannerStatus.Success, weighInfo.weighKey, weighInfo.name);
      }
    }

    private async getExportInfo(eid: string) {
      const exportItem = await ExportEntity.findOneBy({
        id: eid,
        status: ExportStatus.Exporting
      });

      return exportItem;
    }

    private async getWeighInfo(wid: string) {
      const weighItem = await PackingListEntity.findOneBy({
        id: wid,
        weighStatus: WeighStatus.Weighting
      });

      return weighItem;
    }
}

const scanController = new ScanController();

export default scanController;
