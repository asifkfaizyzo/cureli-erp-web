// backend/src/providers/messageCentral/token.js (do not remove this comment)
//backend/src/providers/messageCentral/token.js
import axios from "axios";

const BASE = "https://cpaas.messagecentral.com";

let cache = { token: null, expiresAt: 0 };

/**
 * Fetch and cache MessageCentral auth token.
 * Uses in-memory cache; replace with Redis if you run multiple instances.
 */
export async function getMCAuthToken(customerId, password) {
  if (!customerId || !password) throw new Error("MC credentials missing");

  if (cache.token && Date.now() < cache.expiresAt - 5000) return cache.token;

  const key = password;
  const url = `${BASE}/auth/v1/authentication/token`;

  const resp = await axios.get(url, {
    params: { customerId, key, scope: "NEW" },
    headers: { accept: "*/*" },
    timeout: 10_000,
  });

  if (!resp?.data) throw new Error("Failed to fetch MC token");
// console.log(resp);
const authToken =
  resp.data?.data?.authToken ||
  resp.data?.authToken ||
  resp.data?.token;  // <-- your account uses this



//  const authToken = process.env.TMP_AUTH_TOKEN

  if (!authToken) throw new Error("Auth token missing in MC response");

  // Conservative TTL (25 minutes)
  cache = { token: authToken, expiresAt: Date.now() + 25 * 60 * 1000 };
  return authToken;
}
