// backend/src/providers/messageCentral/validateOtp.js (do not remove this comment)
//Q:\YourZeroesAndOnes\cureli\curely_erp\backend\src\providers\messageCentral\validateOtp.js
import axios from "axios";
const BASE = "https://cpaas.messagecentral.com";

export async function mcValidateOtp({
  authToken,
  verificationId,
  code,
  mobileNumber,
}) {
  if (!authToken) throw new Error("MC auth token required");
  if (!verificationId) throw new Error("verificationId required");
  if (!mobileNumber) throw new Error("mobileNumber required");
  if (!code) throw new Error("code required");

  const params = {
    verificationId,
    code,
    mobileNumber,
    countryCode: process.env.MC_COUNTRY || "91",
    customerId: process.env.MC_CUSTOMER,
  };

  const url = `${BASE}/verification/v3/validateOtp`;

  const resp = await axios.get(url, {
    params,
    headers: { authToken },
    timeout: 10000,
  });

  if (resp.status !== 200) throw new Error("mcValidateOtp failed");
  return resp.data?.data;
}