
class ExportManager {

    /**
     * export session
     */
    sessionSet: Set<string>;

    constructor() {
        this.sessionSet = new Set();
    }

    doesSessionExists(sessionId: string) {
        return this.sessionSet.has(sessionId);
    }

    startSession(sessionId: string) {
        this.sessionSet.add(sessionId);
    }

    endSession(sessionId: string) {
        this.sessionSet.delete(sessionId);
    }
}

const exportManager = new ExportManager();
export default exportManager;
