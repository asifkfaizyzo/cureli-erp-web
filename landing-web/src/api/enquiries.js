// landing-web/src/api/enquiries.js (do not remove this comment)
//landing\src\api\enquiries.js
import API from "./axios";

export const submitEnquiry = (data) => API.post("/enquiries", data);