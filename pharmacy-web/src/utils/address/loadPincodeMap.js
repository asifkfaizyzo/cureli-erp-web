// pharmacy-web/src/utils/address/loadPincodeMap.js (do not remove this comment)
let pincodeMapCache = null;
let loadingPromise = null;

export const loadPincodeMap = async () => {
  // Return cached data if available
  if (pincodeMapCache) return pincodeMapCache;

  // If already loading, wait for that promise
  if (loadingPromise) return loadingPromise;

  // Start loading
  loadingPromise = fetch("/data/pincodeMap.json")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load pincode map");
      return res.json();
    })
    .then((data) => {
      pincodeMapCache = data;
      return data;
    })
    .catch((err) => {
      console.error("Pincode map load error:", err);
      loadingPromise = null; // Reset so we can retry
      return {};
    });

  return loadingPromise;
};

export const getPincodeData = (pincode) => {
  if (!pincodeMapCache) return null;
  return pincodeMapCache[pincode] || null;
};