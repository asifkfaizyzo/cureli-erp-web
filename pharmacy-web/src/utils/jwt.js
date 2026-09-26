// pharmacy-web/src/utils/jwt.js (do not remove this comment)
// src/utils/jwt.js

/**
 * ============================================
 * JWT UTILITIES
 * ============================================
 * 
 * Lightweight JWT decode for pharmacy-web use.
 * NOTE: This does NOT verify the token signature.
 * Verification is done server-side.
 */

/**
 * Decode a JWT token and return the payload
 * @param {string} token - JWT token string
 * @returns {Object|null} Decoded payload or null if invalid
 */
export function decodeJWT(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    // JWT structure: header.payload.signature
    const parts = token.split(".");
    
    if (parts.length !== 3) {
      console.warn("Invalid JWT format");
      return null;
    }

    // Decode the payload (middle part)
    const payload = parts[1];
    
    // Base64Url decode
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token string
 * @returns {boolean} True if expired or invalid
 */
export function isTokenExpired(token) {
  const payload = decodeJWT(token);
  
  if (!payload || !payload.exp) {
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  
  // Add 10 second buffer for clock skew
  return currentTime >= expirationTime - 10000;
}

/**
 * Get time until token expires
 * @param {string} token - JWT token string
 * @returns {number} Milliseconds until expiration, or 0 if expired/invalid
 */
export function getTokenTimeRemaining(token) {
  const payload = decodeJWT(token);
  
  if (!payload || !payload.exp) {
    return 0;
  }

  const expirationTime = payload.exp * 1000;
  const remaining = expirationTime - Date.now();
  
  return Math.max(0, remaining);
}

/**
 * Extract user info from token
 * @param {string} token - JWT token string
 * @returns {Object|null} User info or null
 */
export function getUserFromToken(token) {
  const payload = decodeJWT(token);
  
  if (!payload) {
    return null;
  }

  return {
    user_id: payload.user_id,
    shop_id: payload.shop_id,
    branch_id: payload.branch_id || null,
    role: payload.role,
    status: payload.status,
    session_id: payload.session_id,
  };
}