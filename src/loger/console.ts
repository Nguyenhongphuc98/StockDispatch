
class Console {
    constructor() {
        
    }

    get logtime() {
        const now = Date.now();
        const delta = 7 * 60 * 60 * 1000;
        return new Date(now + delta).toLocaleString();
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
