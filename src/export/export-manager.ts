import { Equal } from "typeorm";
import { ExportEntity, ExportStatus } from "../persistense/export";
import Logger from '../loger';

const TAG = '[EM]';

class ExportManager {
  /**
   * export session
   */
  exporting: Map<string, ExportEntity>;

  constructor() {
    this.exporting = new Map();
    this.init();
  }

  init() {
    setTimeout(async () => {
        const actives = await ExportEntity.find({
            where: {
                status: Equal(ExportStatus.Exporting)
            }
        });

        Logger.log(TAG, "init export session", actives.map(v =>v.name));

        actives.forEach(a => {
            this.exporting.set(a.id, a);
        });
    }, 100);
  }

  doesSessionExists(sessionId: string) {
    return this.exporting.has(sessionId);
  }

  startSession(exportSession: ExportEntity) {
    this.exporting.set(exportSession.id, exportSession);
  }

  endSession(exportSession: string) {
    this.exporting.delete(exportSession);
  }

  getKey(eid: string) {
    const exportSession = this.exporting.get(eid);
    if (exportSession) {
        return exportSession.key;
    }

    return '';
  }
}

const exportManager = new ExportManager();
export default exportManager;
