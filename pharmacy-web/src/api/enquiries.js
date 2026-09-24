// pharmacy-web/src/api/enquiries.js (do not remove this comment)
//pharmacy-web\src\api\enquiries.js
import API from "./axios";

export const submitEnquiry = (data) => API.post("/enquiries", data);
