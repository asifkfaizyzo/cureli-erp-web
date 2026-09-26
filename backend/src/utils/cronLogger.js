// backend/src/utils/cronLogger.js (do not remove this comment)
// backend/src/utils/cronLogger.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logs directory: backend/logs/cron/
const LOG_DIR = path.join(__dirname, "../../logs/cron");

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getLogFilePath() {
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return path.join(LOG_DIR, `cron-${date}.log`);
}

function formatMessage(level, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}\n`;
}

function writeToFile(level, message) {
  const line = formatMessage(level, message);
  const filePath = getLogFilePath();

  fs.appendFile(filePath, line, (err) => {
    if (err) {
      process.stderr.write(`[CRON LOGGER] Failed to write log: ${err.message}\n`);
    }
  });
}

const cronLogger = {
  info: (message) => {
    writeToFile("INFO", message);
  },
  warn: (message) => {
    writeToFile("WARN", message);
  },
  error: (message, err) => {
    const full = err ? `${message} | ${err?.stack || err?.message || String(err)}` : message;
    writeToFile("ERROR", full);
  },
  success: (message) => {
    writeToFile("SUCCESS", message);
  },
};

export default cronLogger;