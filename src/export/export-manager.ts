import { Equal } from "typeorm";
import { ExportEntity, ExportStatus } from "../persistense/export";
import Logger from "../loger";
import { PackingListEntity } from "../persistense/packing-list";

const TAG = "[EM]";

class ExportManager {
  /**
   * export session
   */
  exporting: Map<string, ExportEntity>;

  constructor() {
    this.exporting = new Map();
  }

  async init() {
    const actives = await ExportEntity.find({
      where: {
        status: Equal(ExportStatus.Exporting),
      },
      relations: ["items"],
    });

    Logger.log(
      TAG,
      "init export session",
      actives.map((v) => {
        return { id: v.id, name: v.name };
      })
    );

    actives.forEach((a) => {
      this.exporting.set(a.id.toString(), a);
    });
  }

  doesSessionExists(sessionId: string) {
    return this.exporting.has(sessionId.toString());
  }

  startSession(exportSession: ExportEntity) {
    this.exporting.set(exportSession.id.toString(), exportSession);
  }

  endSession(exportSessionId: string) {
    this.exporting.delete(exportSessionId.toString());
  }

  getKey(eid: string) {
    const exportSession = this.exporting.get(eid);
    if (exportSession) {
      return exportSession.key;
    }

    return "";
  }

  getPackinglistIds(eid: string) {
    const exportSession = this.exporting.get(eid.toString());
    if (exportSession) {
      return exportSession.items.map((v) => v.id.toString());
    }

    return [];
  }
}

const exportManager = new ExportManager();
export default exportManager;
