// cadmin-web/src/api/shopFiles.js (do not remove this comment)
import API from "./axios";

export const uploadShopFile = (formData) =>
  API.post("/shop/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
