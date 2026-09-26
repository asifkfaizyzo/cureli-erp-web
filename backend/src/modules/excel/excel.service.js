// backend/src/modules/excel/excel.service.js (do not remove this comment)
import libre from "libreoffice-convert";
import { promisify } from "util";
import path from "path";
import { exec } from "child_process";
import crypto from "crypto";
import fs from "fs";

const convertAsync = promisify(libre.convert);
const execAsync = promisify(exec);

// ============================================
// LIBREOFFICE PATH CONFIGURATION
// ============================================

/**
 * Find LibreOffice installation path
 */
const findLibreOfficePath = () => {
  if (process.platform === "win32") {
    const possiblePaths = [
      "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
      "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
      "C:\\Program Files\\LibreOffice 7\\program\\soffice.exe",
      "C:\\Program Files\\LibreOffice 24\\program\\soffice.exe",
      "C:\\Program Files\\LibreOffice 26\\program\\soffice.exe",
    ];

    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        return path;
      }
    }

    return null;
  }

  // For Linux/Mac, assume it's in PATH
  return "soffice";
};

// Set LibreOffice path on module load
const LIBREOFFICE_PATH = findLibreOfficePath();

if (LIBREOFFICE_PATH) {
  if (process.platform === "win32") {
    const libreOfficeDir = path.dirname(LIBREOFFICE_PATH);

    // Add to PATH if not already present
    if (!process.env.PATH.includes(libreOfficeDir)) {
      process.env.PATH = `${process.env.PATH};${libreOfficeDir}`;
    }

    // Set LIBREOFFICE_PATH env var (used by libreoffice-convert)
    process.env.LIBREOFFICE_PATH = LIBREOFFICE_PATH;
  }
}

// ============================================
// FILE VALIDATION
// ============================================

/**
 * Validate Excel file - More lenient approach
 */
export const validateExcelFile = (buffer, filename) => {
  const fileExt = path.extname(filename).toLowerCase();

  // Check file extension first
  if (![".xls", ".xlsx"].includes(fileExt)) {
    throw new Error(
      "Invalid file extension. Only .xls and .xlsx files are supported.",
    );
  }

  // Magic numbers for Excel files
  const xlsSignatures = [
    Buffer.from([0xd0, 0xcf, 0x11, 0xe0]), // Standard .xls (OLE2/CFB)
    Buffer.from([0x09, 0x08, 0x10, 0x00]), // Alternative .xls
    Buffer.from([0x09, 0x04, 0x02, 0x00]), // Another .xls variant
    Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), // Extended .xls
  ];

  const xlsxSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // .xlsx (ZIP-based)

  const fileStart = buffer.slice(0, 8); // Check first 8 bytes

  // Check for .xlsx
  

  // Check for various .xls signatures
  for (const signature of xlsSignatures) {
    if (signature.equals(fileStart.slice(0, signature.length))) {
      return "xls";
    }
  }

  // If file extension says .xls or .xlsx, trust it and try to convert
  console.warn(
    "   ⚠ Could not validate file signature, trusting extension:",
    fileExt,
  );
  

  return fileExt.slice(1); // Return 'xls' or 'xlsx'
};

// ============================================
// CONVERSION FUNCTION
// ============================================

/**
 * Convert .xls buffer to .xlsx buffer
 */
export const convertToXlsx = async (inputBuffer, originalFilename) => {
  try {
    // Validate file format
    const detectedFormat = validateExcelFile(inputBuffer, originalFilename);
    const fileExt = path.extname(originalFilename).toLowerCase();

    

    // If already .xlsx, return as-is
    if (detectedFormat === "xlsx") {
      return inputBuffer;
    }

    // Check if LibreOffice is available
    if (!LIBREOFFICE_PATH) {
      throw new Error(
        "LibreOffice not found. Please install LibreOffice to enable .xls conversion.",
      );
    }

    

    const startTime = Date.now();

    try {
      // Set conversion timeout (45 seconds for larger files)
      const timeout = 65000;

      const conversionPromise = convertAsync(inputBuffer, ".xlsx", undefined);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Conversion timeout exceeded (45s)")),
          timeout,
        ),
      );

      const outputBuffer = await Promise.race([
        conversionPromise,
        timeoutPromise,
      ]);

      const duration = Date.now() - startTime;
     

      return outputBuffer;
    } catch (convError) {
      console.error("    Conversion failed:", convError.message);

      // Detailed error analysis
      if (convError.message.includes("timeout")) {
        throw new Error(
          "Conversion timeout. File may be too large or contain complex content.",
        );
      }

      if (
        convError.message.includes("Command failed") ||
        convError.message.includes("spawn") ||
        convError.message.includes("ENOENT")
      ) {
        throw new Error(
          "LibreOffice execution failed. Please ensure LibreOffice is properly installed.",
        );
      }

      if (
        convError.message.includes("EPIPE") ||
        convError.message.includes("ECONNRESET")
      ) {
        throw new Error(
          "LibreOffice process crashed. The file may be corrupted.",
        );
      }

      // Generic conversion error
      throw new Error(`Conversion failed: ${convError.message}`);
    }
  } catch (error) {
    console.error("   ✗ Conversion error:", error.message);

    // Log stack trace in development
    if (process.env.NODE_ENV === "development") {
      console.error("   Stack trace:", error.stack);
    }

    // Re-throw with context
    if (error.message.includes("Invalid file extension")) {
      throw error;
    }

    if (error.message.includes("LibreOffice not found")) {
      throw error;
    }

    throw new Error(`Excel conversion failed: ${error.message}`);
  }
};

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Check if LibreOffice is installed and working
 */
export const checkHealth = async () => {
  try {
    if (!LIBREOFFICE_PATH) {
      return {
        available: false,
        libreOfficeInstalled: false,
        version: null,
        path: null,
        message: "LibreOffice not found in standard installation paths.",
      };
    }

    let command = `"${LIBREOFFICE_PATH}" --version`;

    // For non-Windows, use simple command
    if (process.platform !== "win32") {
      command = "soffice --version";
    }

    const { stdout, stderr } = await execAsync(command, { timeout: 5000 });

    if (stderr) {
      console.warn("LibreOffice stderr:", stderr);
    }

    const version = stdout.trim();

    return {
      available: true,
      libreOfficeInstalled: true,
      version: version,
      path: LIBREOFFICE_PATH,
      message: "Conversion service is operational",
    };
  } catch (error) {
    console.error("LibreOffice health check failed:", error.message);

    return {
      available: false,
      libreOfficeInstalled: false,
      version: null,
      path: LIBREOFFICE_PATH,
      message: "LibreOffice installed but not responding.",
      error: error.message,
    };
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get file hash for logging/debugging
 */
export const getFileHash = (buffer) => {
  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex")
    .substring(0, 16);
};

/**
 * Get LibreOffice path (for debugging)
 */
export const getLibreOfficePath = () => {
  return LIBREOFFICE_PATH;
};
