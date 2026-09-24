// pharmacy-web/src/utils/address/loadStateList.js (do not remove this comment)
let stateListCache = null;
let loadingPromise = null;

export const loadStateList = async () => {
  if (stateListCache) return stateListCache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = fetch("/data/stateList.json")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load state list");
      return res.json();
    })
    .then((data) => {
      stateListCache = data;
      return data;
    })
    .catch((err) => {
      console.error("State list load error:", err);
      loadingPromise = null;
      return [];
    });

  return loadingPromise;
};

export const searchStates = (query) => {
  if (!stateListCache) return [];
  if (!query) return stateListCache;

  const lowerQuery = query.toLowerCase().trim();
  return stateListCache.filter((state) =>
    state.toLowerCase().startsWith(lowerQuery)
  );
};