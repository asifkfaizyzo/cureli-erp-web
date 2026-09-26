// backend/src/utils/response.js (do not remove this comment)
//Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\utils\response.js
export function success(res, data = {}, message = "Success", status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data: JSON.parse(
      JSON.stringify(data, (_, value) =>
        typeof value === "bigint" ? Number(value) : value
      )
    ),
  });
}

export function fail(res, message = "Failed", status = 400, data = {}) {
  return res.status(status).json({
    success: false,
    message,
    data,
  });
}

