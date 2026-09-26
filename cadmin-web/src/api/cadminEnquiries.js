// cadmin-web/src/api/cadminEnquiries.js (do not remove this comment)
// cadmin-web/src/api/cadminEnquiries.js
import CAdminAPI from "./axios";

// Logger for development only
const log = (...args) => {
  if (process.env.NODE_ENV !== "production") {
    // console.log(...args);
  }
};

// Get all enquiries with filters and pagination
export const getEnquiries = async (params) => {
  try {
    const response = await CAdminAPI.get("/enquiries/admin/list", { params });
    log("API getEnquiries response:", response);
    return response;
  } catch (error) {
    log("API getEnquiries error:", error);
    throw error;
  }
};

// Get enquiry statistics
export const getEnquiryStats = async () => {
  try {
    const response = await CAdminAPI.get("/enquiries/admin/stats");
    log("API getEnquiryStats response:", response);
    return response;
  } catch (error) {
    log("API getEnquiryStats error:", error);
    throw error;
  }
};

// Get single enquiry details by ID
export const getEnquiryDetails = async (enquiryId) => {
  try {
    if (!enquiryId) {
      throw new Error("Enquiry ID is required");
    }
    const response = await CAdminAPI.get(`/enquiries/admin/${enquiryId}`);
    log("API getEnquiryDetails response:", response);
    return response;
  } catch (error) {
    log("API getEnquiryDetails error:", error);
    throw error;
  }
};

// Reply to an enquiry
export const replyToEnquiry = async (enquiryId, data) => {
  try {
    if (!enquiryId) {
      throw new Error("Enquiry ID is required");
    }
    if (!data?.subject || !data?.message) {
      throw new Error("Subject and message are required");
    }
    const response = await CAdminAPI.post(
      `/enquiries/admin/${enquiryId}/reply`,
      data,
    );
    log("API replyToEnquiry response:", response);
    return response;
  } catch (error) {
    log("API replyToEnquiry error:", error);
    throw error;
  }
};

// Update enquiry status
export const updateEnquiryStatus = async (enquiryId, status) => {
  try {
    if (!enquiryId) {
      throw new Error("Enquiry ID is required");
    }
    if (!status) {
      throw new Error("Status is required");
    }
    const response = await CAdminAPI.patch(
      `/enquiries/admin/${enquiryId}/status`,
      { status },
    );
    log("API updateEnquiryStatus response:", response);
    return response;
  } catch (error) {
    log("API updateEnquiryStatus error:", error);
    throw error;
  }
};

// Delete an enquiry
export const deleteEnquiry = async (enquiryId) => {
  try {
    if (!enquiryId) {
      throw new Error("Enquiry ID is required");
    }
    const response = await CAdminAPI.delete(`/enquiries/admin/${enquiryId}`);
    log("API deleteEnquiry response:", response);
    return response;
  } catch (error) {
    log("API deleteEnquiry error:", error);
    throw error;
  }
};
