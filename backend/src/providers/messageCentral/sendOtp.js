// backend/src/providers/messageCentral/sendOtp.js (do not remove this comment)
//Q:\YourZeroesAndOnes\cureli\curely_erp\backend\src\providers\messageCentral\sendOtp.js
import axios from "axios";
const BASE = "https://cpaas.messagecentral.com";

export async function mcSendOtp({
  authToken,
  customerId,
  mobileNumber,
  otpLength = 4,
  countryCode = "91",
}) {
  console.log("🚀 mcSendOtp called");

  if (!authToken) throw new Error("MC auth token required");

  const url = `${BASE}/verification/v3/send`;
  const params = {
    customerId,
    mobileNumber,
    flowType: "SMS",
    otpLength,
    countryCode,
  };

  console.log("📡 Making request to:", url);
  console.log("📦 Params:", params);

  try {
    const resp = await axios.post(url, null, {
      params,
      headers: { authToken },
      timeout: 10_000,
    });

    console.log(" Response status:", resp.status);
    console.log("📥 Response data:", JSON.stringify(resp.data, null, 2));

    if (resp.status !== 200) throw new Error("mcSendOtp failed");
    return resp.data?.data;
  } catch (err) {
    console.error(" mcSendOtp error:", err.message);
    console.error(" Response data:", err.response?.data);
    console.error(" Response status:", err.response?.status);
    throw err;
  }
}
