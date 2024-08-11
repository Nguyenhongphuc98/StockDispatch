import { Equal } from "typeorm";
import { ExportEntity, ExportStatus } from "../persistense/export";
import Logger from "../loger";
import { PackingListEntity, WeighStatus } from "../persistense/packing-list";

const TAG = "[WM]";

class WeighManager {
  /**
   * weigh session
   */
  weighting: Map<string, PackingListEntity>;

  constructor() {
    this.weighting = new Map();
  }

  async init() {
    const actives = await PackingListEntity.find({
      where: {
        weighStatus: Equal(WeighStatus.Weighting),
      }
    });

    Logger.log(
      TAG,
      "init weigh session",
      actives.map((v) => {
        return { id: v.id, name: v.name };
      })
    );

    actives.forEach((a) => {
      this.weighting.set(a.id.toString(), a);
    });
  }

  doesSessionExists(sessionId: string) {
    return this.weighting.has(sessionId.toString());
  }

  startSession(weighSession: PackingListEntity) {
    this.weighting.set(weighSession.id.toString(), weighSession);
  }

  endSession(weighSessionId: string) {
    this.weighting.delete(weighSessionId.toString());
  }

  getKey(eid: string) {
    const weighSession = this.weighting.get(eid);
    if (weighSession) {
      return weighSession.weighKey;
    }

    return "";
  }

  getPackinglistIds(eid: string) {
    const exportSession = this.weighting.get(eid.toString());
    if (exportSession) {
      return exportSession.items.map((v) => v.id.toString());
    }

    return [];
  }
}

const weighManager = new WeighManager();
export default weighManager;
