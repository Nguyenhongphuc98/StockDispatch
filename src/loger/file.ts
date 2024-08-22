import systemTime from "../utils/system-time";

const MAX_LOGS_FILE = 14;
const MAX_LOGS_TIME = 24 * 60 * 60 * 1000;
// const MAX_LOGS_FILE = 3;
// const MAX_LOGS_TIME = 5 * 60 * 1000;

const LOGS_DIR_PATH = "/etc/logs";

const fs = require("fs");
const path = require("path");

if (!fs.existsSync(LOGS_DIR_PATH)) {
    fs.mkdirSync(LOGS_DIR_PATH, { recursive: true });
}

class FileLog {
  currentFile: number;
  fileIndex: string;

  constructor() {
    this.currentFile = 0;
    this.fileIndex = "0.txt";
    this.init();
  }

  get logtime() {
    return systemTime.date().toLocaleString();
  }

  getFiles() {
    const files = fs
      .readdirSync(LOGS_DIR_PATH)
      .filter((file) => /^[0-9]+\.txt$/.test(file))
      .map((file) => parseInt(file.split(".")[0], 10))
      .sort((a, b) => a - b);
    return files;
  }

  init() {
    const files = this.getFiles();

    const latestFileIndex = files.length > 0 ? files[files.length - 1] : -1;
    const nextFileIndex = latestFileIndex + 1;

    this.fileIndex = nextFileIndex;
    this.currentFile = path.join(LOGS_DIR_PATH, `${nextFileIndex}.txt`);

    this.deleteOldFiles();

    setInterval(() => {
      this.rotateFile();
      this.deleteOldFiles();
    }, MAX_LOGS_TIME);
  }

  deleteOldFiles() {
    const files = this.getFiles();
    if (files.length >= MAX_LOGS_FILE) {
      const filesToDelete = files.slice(0, files.length - MAX_LOGS_FILE + 1);
      filesToDelete.forEach((fileIndex) => {
        fs.unlinkSync(path.join(LOGS_DIR_PATH, `${fileIndex}.txt`));
      });
    }
  }

  rotateFile() {
    this.fileIndex += 1;
    this.currentFile = path.join(LOGS_DIR_PATH, `${this.fileIndex}.txt`);
  }

  log(...args) {
    this.toFile('[INFO]', ...args);
  }

  error(...args) {
    this.toFile('[ERR]', ...args);
  }

  warn(...args) {
    this.toFile('[WAR]', ...args);
  }

  toFile(...args) {
    try {
        const message = args.map(v => {
            return typeof v == "string" ? v : JSON.stringify(v);
        }).join(", ");
        fs.appendFileSync(this.currentFile, `${this.logtime} - ${message}\n`);
    } catch (error) {
        console.error('write log got error parse', error)
    }
  }
}

const fileLog = new FileLog();
export default fileLog;
