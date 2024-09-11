import Console from "./console";
import fileLog from "./file";


const EN_FILE = true;
const EN_CONSOLE = false;

class Logger {
    constructor() {
        
    }

    log(...args) {
        if (EN_FILE) {
            fileLog.log(...args);
        }

        if (EN_CONSOLE) {
            Console.log(...args);
        }
    }

    error(...args) {
        if (EN_FILE) {
            fileLog.error(...args);
        }

        if (EN_CONSOLE) {
            Console.error(...args);
        }
    }

    warn(...args) {
        if (EN_FILE) {
            fileLog.warn(...args);
        }

        if (EN_CONSOLE) {
            Console.warn(...args);
        }
    }
}

const logger = new Logger();

export default logger;
