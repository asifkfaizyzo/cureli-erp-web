// backend/src/modules/excel/excel.controller.js (do not remove this comment)
import * as excelService from "./excel.service.js";

/**
 * Convert Excel file from .xls to .xlsx
 */
export const convertExcel = async (req, res, next) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
        error: "Please select a file to upload",
      });
    }

    const { buffer, originalname, mimetype, size } = req.file;
    const userId = req.user?.user_id;
    const shopId = req.user?.shop_id;

   

    // Convert the file
    const convertedBuffer = await excelService.convertToXlsx(
      buffer,
      originalname,
    );

    const conversionTime = Date.now() - startTime;

   

    // Set response headers
    const outputFilename = originalname.replace(/\.xls$/i, ".xlsx");

    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${outputFilename}"`,
      "Content-Length": convertedBuffer.length,
      "X-Conversion-Time": `${conversionTime}ms`,
      "X-Original-Size": size,
      "X-Converted-Size": convertedBuffer.length,
      "Cache-Control": "no-store",
    });

    // Send the converted file
    res.send(convertedBuffer);
  } catch (error) {
    console.error("\n Excel Conversion Error:", error.message);
    console.error(error.stack);

    // Specific error handling
    let statusCode = 500;
    let message = "File conversion failed";

    if (error.message.includes("LibreOffice")) {
      message = "Conversion service unavailable. Please contact administrator.";
      statusCode = 503;
    } else if (error.message.includes("timeout")) {
      message = "File conversion timeout. File may be too large or complex.";
      statusCode = 408;
    } else if (error.message.includes("Unsupported")) {
      message = error.message;
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message: message,
      error: error.message,
    });
  }
};

/**
 * Health check for conversion service
 */
export const healthCheck = async (req, res, next) => {
  try {
    const health = await excelService.checkHealth();

    res.json({
      success: true,
      data: {
        service: "Excel Conversion Service",
        status: health.available ? "operational" : "unavailable",
        libreOffice: {
          installed: health.libreOfficeInstalled,
          version: health.version || "N/A",
        },
        message: health.message,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error.message,
    });
  }
};
