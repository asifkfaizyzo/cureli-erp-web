// pharmacy-web/src/utils/address/loadCityList.js (do not remove this comment)
let cityListCache = null;
let loadingPromise = null;

export const loadCityList = async () => {
  if (cityListCache) return cityListCache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = fetch("/data/cityList.json")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load city list");
      return res.json();
    })
    .then((data) => {
      cityListCache = data;
      return data;
    })
    .catch((err) => {
      console.error("City list load error:", err);
      loadingPromise = null;
      return [];
    });

  return loadingPromise;
};

export const searchCities = (query, limit = 10) => {
  if (!cityListCache || !query) return [];
  
  const lowerQuery = query.toLowerCase().trim();
  if (lowerQuery.length < 2) return [];

  const results = [];
  
  for (const item of cityListCache) {
    if (item.city.toLowerCase().startsWith(lowerQuery)) {
      results.push(item);
      if (results.length >= limit) break;
    }
  }

  return results;
};