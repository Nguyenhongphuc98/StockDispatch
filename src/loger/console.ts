import systemTime from "../utils/system-time";

class Console {
    constructor() {
        
    }

    get logtime() {
        return systemTime.date().toLocaleString();
    }

    log(...args) {
        console.log(this.logtime, ...args);
    }

    error(...args) {
        console.error(this.logtime, ...args);
    }

    warn(...args) {
        console.warn(this.logtime, ...args);
    }
}

const consolelog = new Console();
export default consolelog;
