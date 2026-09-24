// backend/src/modules/medicines/linking.service.js (do not remove this comment)
import prisma from "../../config/prisma.js";
import { createListingForMedicine, handleMedicineUnlinked } from "../marketplace-listings/listings.service.js";
import * as audit from "../audit/index.js";
import { notify } from "../notifications/index.js";
import { NOTIFICATION_EVENTS } from "../notifications/notification.events.js";

// ══════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════

const THRESHOLDS = {
  AUTO_LINK: 92,
  SUGGEST:   75,
  MIN_MATCH: 65,
};

const SCORE_WEIGHTS = {
  NAME:         40,
  STRENGTH:     25,
  COMPOSITION:  20,
  MANUFACTURER: 15,
};

// ══════════════════════════════════════════════════════════════
// STRING UTILITIES
// ══════════════════════════════════════════════════════════════

function normalizeString(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const FORM_WORDS = [
  "tablet", "tablets", "tab", "tabs",
  "capsule", "capsules", "cap", "caps",
  "syrup", "suspension", "solution",
  "injection", "inj",
  "cream", "ointment", "gel", "lotion",
  "drops", "drop",
  "powder", "granules",
  "spray", "inhaler",
  "patch", "patches",
  "suppository", "suppositories",
  "liquid", "liqu", "syrp",
  "cr", "sr", "xl", "xr", "er", "mr", "od", "la", "ds", "forte",
];

function stripFormAndPackSuffix(name) {
  if (!name) return "";
  let result = name.trim();

  result = result.replace(/\s+\d+\s+tab['']?s?\s*$/i, "");
  result = result.replace(/\s+\d+\s+cap['']?s?\s*$/i, "");
  result = result.replace(/\s+\d+\s+['']?s\s*$/i, "");

  let changed = true;
  while (changed) {
    changed = false;
    for (const form of FORM_WORDS) {
      const regex = new RegExp(`\\s+${form}\\s*$`, "i");
      if (regex.test(result)) {
        result = result.replace(regex, "").trim();
        changed = true;
      }
    }
  }

  return result.trim();
}

function extractBrandToken(name) {
  if (!name) return null;
  const cleaned    = name.replace(/-(\d)/g, " $1");
  const normalized = normalizeString(cleaned);
  const tokens     = normalized.split(" ").filter((t) => {
    if (t.length < 2)                           return false;
    if (/^\d+(\.\d+)?$/.test(t))                return false;
    if (/^\d+\s*(mg|mcg|g|ml|%|iu)$/i.test(t)) return false;
    if (FORM_WORDS.includes(t))                 return false;
    return true;
  });
  return tokens.length > 0 ? tokens[0] : null;
}

function normalizeUnit(unit) {
  if (!unit) return "";
  const normalized = unit.toLowerCase().trim();
  const unitMap = {
    milligram: "mg", milligrams: "mg",
    microgram: "mcg", micrograms: "mcg",
    gram: "g", grams: "g",
    milliliter: "ml", milliliters: "ml",
    liter: "l", liters: "l",
    unit: "iu", units: "iu",
  };
  return unitMap[normalized] || normalized;
}

function extractStrength(name) {
  if (!name) return null;
  const normalized = name.replace(/-(\d)/g, " $1");

  const explicitPatterns = [
    /(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|l|iu|%|units?)/i,
    /(\d+(?:\.\d+)?)\s*(milligrams?|micrograms?|grams?|milliliters?|liters?)/i,
  ];

  for (const pattern of explicitPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        value:    parseFloat(match[1]),
        unit:     normalizeUnit(match[2]),
        raw:      match[0],
        inferred: false,
      };
    }
  }

  const brandToken = extractBrandToken(name);
  if (brandToken) {
    const normalizedLower = normalized.toLowerCase();
    const brandIdx        = normalizedLower.indexOf(brandToken.toLowerCase());
    if (brandIdx !== -1) {
      const afterBrand    = normalized.slice(brandIdx + brandToken.length);
      const firstNumMatch = afterBrand.match(/^\s*(\d+(?:\.\d+)?)/);
      if (firstNumMatch) {
        const val = parseFloat(firstNumMatch[1]);
        const isNonInteger = val !== Math.floor(val);
        const plausibleDosages = [
          0.25, 0.5, 1, 2, 2.5, 4, 5, 6.4, 8, 10, 12.5, 15, 20, 25, 30, 40,
          50, 60, 75, 80, 100, 125, 150, 200, 250, 300, 400, 500, 600, 650,
          750, 800, 1000,
        ];
        const likelyStrength =
          isNonInteger ||
          (plausibleDosages.includes(val) && val <= 30) ||
          (val > 30 && val <= 1000 && plausibleDosages.includes(val));
        const brandCodePrefixes = [
          "la", "hp", "ds", "sr", "cr", "xl", "xr", "er", "mr",
          "od", "ls", "hs", "fc", "dt", "md", "rd", "hd", "ld", "pd",
        ];
        const lastWordOfBrand = brandToken.split(/\s+/).pop()?.toLowerCase() || "";
        const isBrandCode     = brandCodePrefixes.includes(lastWordOfBrand);
        if (likelyStrength && !isBrandCode) {
          return {
            value:    val,
            unit:     "mg",
            raw:      firstNumMatch[1],
            inferred: true,
          };
        }
      }
    }
  }

  return null;
}

function levenshteinDistance(str1, str2) {
  const m  = str1.length;
  const n  = str2.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        str1[i - 1] === str2[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function calculateStringSimilarity(str1, str2) {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  if (!s1 || !s2) return 0;
  if (s1 === s2)  return 1;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(s1, s2) / maxLen;
}

// ══════════════════════════════════════════════════════════════
// PACK COUNT EXTRACTION
// ══════════════════════════════════════════════════════════════

function extractPackCount(packStr) {
  if (!packStr || !packStr.trim()) return null;
  const cleaned = packStr.trim().replace(/[''']/g, "").replace(/\s+/g, " ");
  const match   = cleaned.match(/^(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  return isNaN(val) ? null : Math.round(val);
}

// ══════════════════════════════════════════════════════════════
// PACK SIZE SCORE
// ══════════════════════════════════════════════════════════════

function calculatePackScore(shopPackSize, masterPackSize) {
  const shopCount   = extractPackCount(shopPackSize);
  const masterCount = extractPackCount(masterPackSize);
  if (shopCount === null && masterCount === null) return 0.5;
  if (shopCount === null || masterCount === null)  return 0.5;
  if (shopCount === masterCount)                   return 1.0;
  return 0.0;
}

// ══════════════════════════════════════════════════════════════
// NAME SIMILARITY SCORE
// ══════════════════════════════════════════════════════════════

function calculateNameSimilarityScore(shopName, masterVariantName) {
  const shopCore   = normalizeString(stripFormAndPackSuffix(shopName));
  const masterCore = normalizeString(stripFormAndPackSuffix(masterVariantName));
  if (!shopCore || !masterCore) return 0;
  return calculateStringSimilarity(shopCore, masterCore);
}

// ══════════════════════════════════════════════════════════════
// SCORING FUNCTIONS
// ══════════════════════════════════════════════════════════════

function calculateNameScore(shopName, masterName, masterBrand) {
  const shopNorm   = normalizeString(shopName);
  const masterNorm = normalizeString(masterName);
  const brandNorm  = normalizeString(masterBrand);
  const shopCore   = normalizeString(stripFormAndPackSuffix(shopName));
  const masterCore = normalizeString(stripFormAndPackSuffix(masterName));
  const brandCore  = masterBrand ? normalizeString(stripFormAndPackSuffix(masterBrand)) : "";

  const shopBrandToken   = extractBrandToken(shopName);
  const masterBrandToken = extractBrandToken(masterName);
  const masterBrandField = masterBrand ? extractBrandToken(masterBrand) : null;

  if (shopNorm === masterNorm)
    return { score: SCORE_WEIGHTS.NAME, reason: "Exact name match" };
  if (brandNorm && shopNorm === brandNorm)
    return { score: SCORE_WEIGHTS.NAME, reason: "Exact name match" };
  if (shopCore && masterCore && shopCore === masterCore)
    return { score: SCORE_WEIGHTS.NAME, reason: "Exact name match" };
  if (shopCore && brandCore && shopCore === brandCore)
    return { score: SCORE_WEIGHTS.NAME, reason: "Exact name match" };
  if (shopBrandToken && masterBrandField && shopBrandToken === masterBrandField)
    return { score: SCORE_WEIGHTS.NAME, reason: "Exact name match" };
  if (shopBrandToken && masterBrandToken && shopBrandToken === masterBrandToken)
    return { score: SCORE_WEIGHTS.NAME * 0.95, reason: "Exact name match" };
  if (shopNorm.includes(masterNorm) || masterNorm.includes(shopNorm))
    return { score: SCORE_WEIGHTS.NAME * 0.9, reason: "Name contains match" };
  if (brandNorm && (shopNorm.includes(brandNorm) || brandNorm.includes(shopNorm)))
    return { score: SCORE_WEIGHTS.NAME * 0.85, reason: "Brand contains match" };
  if (shopCore && masterCore && (shopCore.includes(masterCore) || masterCore.includes(shopCore)))
    return { score: SCORE_WEIGHTS.NAME * 0.88, reason: "Core name contains match" };

  const nameSim  = calculateStringSimilarity(shopNorm, masterNorm);
  const brandSim = brandNorm ? calculateStringSimilarity(shopNorm, brandNorm) : 0;
  const coreSim  = shopCore && masterCore ? calculateStringSimilarity(shopCore, masterCore) : 0;
  const bestSim  = Math.max(nameSim, brandSim, coreSim);

  if (bestSim >= 0.85)
    return { score: SCORE_WEIGHTS.NAME * bestSim,       reason: `Name similarity ${Math.round(bestSim * 100)}%` };
  if (bestSim >= 0.7)
    return { score: SCORE_WEIGHTS.NAME * bestSim * 0.8, reason: `Partial name match ${Math.round(bestSim * 100)}%` };

  return { score: 0, reason: "Name mismatch" };
}

function calculateStrengthScore(shopName, masterVariant) {
  const shopStrength = extractStrength(shopName);

  let masterStrength = null;
  if (masterVariant.strength_value != null && masterVariant.strength_unit) {
    masterStrength = {
      value:    parseFloat(masterVariant.strength_value),
      unit:     normalizeUnit(masterVariant.strength_unit),
      inferred: false,
    };
  } else {
    masterStrength = extractStrength(masterVariant.name);
  }

  if (!shopStrength && !masterStrength)
    return { score: SCORE_WEIGHTS.STRENGTH * 0.5, reason: "No strength specified", isBlocking: false };
  if (!shopStrength && masterStrength)
    return { score: SCORE_WEIGHTS.STRENGTH * 0.4, reason: "Shop strength unknown", isBlocking: false };
  if (shopStrength && !masterStrength)
    return { score: SCORE_WEIGHTS.STRENGTH * 0.3, reason: "Master strength unknown", isBlocking: false };

  const valuesMatch = Math.abs(shopStrength.value - masterStrength.value) < 0.01;
  const unitsMatch  = shopStrength.unit === masterStrength.unit;
  const oneInferred = !!(shopStrength.inferred || masterStrength.inferred);

  if (valuesMatch && (unitsMatch || oneInferred)) {
    const multiplier = oneInferred ? 0.92 : 1.0;
    return {
      score:      SCORE_WEIGHTS.STRENGTH * multiplier,
      reason:     `Strength match: ${shopStrength.value}${shopStrength.unit}${oneInferred ? " (inferred)" : ""}`,
      isBlocking: false,
    };
  }

  if (!unitsMatch) {
    return {
      score:      0,
      reason:     `Strength unit mismatch: ${shopStrength.unit} vs ${masterStrength.unit}`,
      isBlocking: true,
    };
  }

  if (oneInferred) {
    return {
      score:      SCORE_WEIGHTS.STRENGTH * 0.3,
      reason:     `Strength uncertain: ${shopStrength.value}${shopStrength.unit} vs ${masterStrength.value}${masterStrength.unit} (inferred)`,
      isBlocking: false,
    };
  }

  return {
    score:      0,
    reason:     `Strength mismatch: ${shopStrength.value}${shopStrength.unit} vs ${masterStrength.value}${masterStrength.unit}`,
    isBlocking: false,
  };
}

function calculateCompositionScore(shopGenericName, masterComposition) {
  if (!shopGenericName || !masterComposition)
    return { score: 0, reason: "No composition to compare", unavailable: true };

  const shopNorm         = normalizeString(shopGenericName);
  let   compositionNames = [];

  if (Array.isArray(masterComposition)) {
    compositionNames = masterComposition.map((c) => normalizeString(c.name || c));
  } else if (typeof masterComposition === "string") {
    compositionNames = [normalizeString(masterComposition)];
  }

  if (compositionNames.length === 0)
    return { score: 0, reason: "No master composition", unavailable: true };

  for (const compName of compositionNames) {
    if (shopNorm === compName)
      return { score: SCORE_WEIGHTS.COMPOSITION, reason: "Exact composition match" };
    if (shopNorm.includes(compName) || compName.includes(shopNorm))
      return { score: SCORE_WEIGHTS.COMPOSITION * 0.9, reason: "Composition contains match" };
    const sim = calculateStringSimilarity(shopNorm, compName);
    if (sim >= 0.8)
      return { score: SCORE_WEIGHTS.COMPOSITION * sim, reason: `Composition similarity ${Math.round(sim * 100)}%` };
  }

  return { score: 0, reason: "Composition mismatch" };
}

function calculateManufacturerScore(shopManufacturer, masterManufacturer, masterMarketer) {
  if (!shopManufacturer) return { score: 0, reason: "No shop manufacturer" };

  const shopNorm = normalizeString(shopManufacturer);
  const mfrNorm  = normalizeString(masterManufacturer);
  const mktNorm  = normalizeString(masterMarketer);

  if (mfrNorm && shopNorm === mfrNorm)
    return { score: SCORE_WEIGHTS.MANUFACTURER, reason: "Exact manufacturer match" };
  if (mktNorm && shopNorm === mktNorm)
    return { score: SCORE_WEIGHTS.MANUFACTURER, reason: "Exact marketer match" };
  if (mfrNorm && (shopNorm.includes(mfrNorm) || mfrNorm.includes(shopNorm)))
    return { score: SCORE_WEIGHTS.MANUFACTURER * 0.9, reason: "Manufacturer contains match" };
  if (mktNorm && (shopNorm.includes(mktNorm) || mktNorm.includes(shopNorm)))
    return { score: SCORE_WEIGHTS.MANUFACTURER * 0.85, reason: "Marketer contains match" };

  const mfrSim  = mfrNorm ? calculateStringSimilarity(shopNorm, mfrNorm) : 0;
  const mktSim  = mktNorm ? calculateStringSimilarity(shopNorm, mktNorm) : 0;
  const bestSim = Math.max(mfrSim, mktSim);

  if (bestSim >= 0.7)
    return { score: SCORE_WEIGHTS.MANUFACTURER * bestSim, reason: `Manufacturer similarity ${Math.round(bestSim * 100)}%` };

  return { score: 0, reason: "Manufacturer mismatch" };
}

function calculateMatchScore(shopMedicine, masterMedicine, masterVariant) {
  const scores = {
    name:         calculateNameScore(shopMedicine.name, masterVariant.name, masterVariant.brand),
    strength:     calculateStrengthScore(shopMedicine.name, masterVariant),
    composition:  calculateCompositionScore(shopMedicine.generic_name, masterMedicine.composition),
    manufacturer: calculateManufacturerScore(shopMedicine.manufacturer, masterVariant.manufacturer, masterVariant.marketer),
  };

  if (scores.strength.isBlocking) {
    return {
      totalScore: 0,
      scores,
      reasons:     [scores.strength.reason],
      isBlocked:   true,
      blockReason: scores.strength.reason,
    };
  }

  const compositionUnavailable = scores.composition.unavailable === true;

  let totalScore;
  if (compositionUnavailable) {
    const rawScore    = scores.name.score + scores.strength.score + scores.manufacturer.score;
    const maxPossible = SCORE_WEIGHTS.NAME + SCORE_WEIGHTS.STRENGTH + SCORE_WEIGHTS.MANUFACTURER;
    totalScore        = Math.round((rawScore / maxPossible) * 100);
  } else {
    totalScore = Math.round(
      scores.name.score +
      scores.strength.score +
      scores.composition.score +
      scores.manufacturer.score,
    );
  }

  const isExactNameMatch = scores.name.reason === "Exact name match";
  const strengthMatches  =
    !scores.strength.isBlocking &&
    scores.strength.score >= SCORE_WEIGHTS.STRENGTH * 0.4;

  if (isExactNameMatch && !scores.strength.isBlocking) {
    if (compositionUnavailable && strengthMatches) {
      totalScore = Math.max(totalScore, THRESHOLDS.AUTO_LINK);
    } else if (compositionUnavailable) {
      totalScore = Math.max(totalScore, THRESHOLDS.SUGGEST + 5);
    } else if (totalScore < THRESHOLDS.SUGGEST) {
      totalScore = Math.max(totalScore, THRESHOLDS.SUGGEST);
    } else if (totalScore >= THRESHOLDS.SUGGEST && totalScore < THRESHOLDS.AUTO_LINK) {
      totalScore = Math.max(totalScore, 88);
    }
  }

  const reasons = [
    scores.name.reason,
    scores.strength.reason,
    scores.composition.reason,
    scores.manufacturer.reason,
  ].filter((r) => r && !r.includes("mismatch") && !r.includes("No "));

  return { totalScore, scores, reasons, isBlocked: false };
}

// ══════════════════════════════════════════════════════════════
// findPotentialMatches
// ══════════════════════════════════════════════════════════════

async function findPotentialMatches(shopMedicine, limit = 20) {
  const { name, manufacturer, generic_name } = shopMedicine;

  if (!name || !name.trim()) return [];

  const brandToken = extractBrandToken(name);

  if (!brandToken && name.trim().length < 3) return [];

  const variantMap = new Map();

  const includeClause = {
    master: {
      select: {
        master_medicine_id: true,
        master_key:         true,
        generic_name:       true,
        type:               true,
        form:               true,
        composition:        true,
        primary_category:   true,
      },
    },
  };

  if (brandToken && brandToken.length >= 4) {
    try {
      const brandMatches = await prisma.masterMedicineVariant.findMany({
        where: {
          OR: [
            { name:  { contains: brandToken, mode: "insensitive" } },
            { brand: { contains: brandToken, mode: "insensitive" } },
          ],
        },
        include: includeClause,
        take:    40,
      });
      brandMatches.forEach((v) => variantMap.set(v.variant_id, v));
    } catch { /* non-fatal */ }
  }

  if (brandToken && brandToken.length >= 2 && brandToken.length < 4) {
    try {
      const shortMatches = await prisma.masterMedicineVariant.findMany({
        where:   { brand: { equals: brandToken, mode: "insensitive" } },
        include: includeClause,
        take:    10,
      });
      shortMatches.forEach((v) => variantMap.set(v.variant_id, v));
    } catch { /* non-fatal */ }
  }

  if (variantMap.size < 3) {
    try {
      const exactMatches = await prisma.masterMedicineVariant.findMany({
        where:   { name: { equals: name.trim(), mode: "insensitive" } },
        include: includeClause,
        take:    5,
      });
      exactMatches.forEach((v) => variantMap.set(v.variant_id, v));
    } catch { /* non-fatal */ }
  }

  if (variantMap.size < 3 && generic_name && generic_name.trim().length > 3) {
    const genericTokens = normalizeString(generic_name)
      .split(" ")
      .filter((t) => t.length > 3)
      .slice(0, 2);

    if (genericTokens.length > 0) {
      try {
        const genericMatches = await prisma.masterMedicineVariant.findMany({
          where: {
            master: {
              OR: genericTokens.map((token) => ({
                generic_name: { contains: token, mode: "insensitive" },
              })),
            },
          },
          include: includeClause,
          take:    20,
        });
        genericMatches.forEach((v) => variantMap.set(v.variant_id, v));
      } catch { /* non-fatal */ }
    }
  }

  if (variantMap.size < 2 && brandToken && brandToken.length >= 4) {
    try {
      const masterFallback = await prisma.masterMedicineVariant.findMany({
        where: {
          master: { generic_name: { contains: brandToken, mode: "insensitive" } },
        },
        include: includeClause,
        take:    15,
      });
      masterFallback.forEach((v) => variantMap.set(v.variant_id, v));
    } catch { /* non-fatal */ }
  }

  if (variantMap.size === 0) return [];

  const variants = Array.from(variantMap.values());

  return variants
    .map((variant) => {
      const matchResult = calculateMatchScore(shopMedicine, variant.master, variant);
      return { variant, master: variant.master, ...matchResult };
    })
    .filter((m) => !m.isBlocked && m.totalScore >= THRESHOLDS.MIN_MATCH)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);
}

// ══════════════════════════════════════════════════════════════
// checkSingleMedicine
// ══════════════════════════════════════════════════════════════

export async function checkSingleMedicine(shopMedicine) {
  const matches = await findPotentialMatches(shopMedicine, 5);

  if (matches.length === 0) {
    return {
      status:             "NO_MATCH",
      confidence:         0,
      reason:             "No matching medicine found in master catalog",
      master_medicine_id: null,
      matched_variant:    null,
      suggestions:        [],
    };
  }

  const topMatch              = matches[0];
  const confidence            = topMatch.totalScore;
  const highConfidenceMatches = matches.filter((m) => m.totalScore >= THRESHOLDS.AUTO_LINK);
  const uniqueMasterIds       = new Set(highConfidenceMatches.map((m) => m.master.master_medicine_id));
  const multipleDistinctMasters = uniqueMasterIds.size > 1;

  if (highConfidenceMatches.length > 1 && multipleDistinctMasters) {
    return {
      status:              "PENDING",
      confidence,
      reason:              `Multiple distinct medicines match (${uniqueMasterIds.size} candidates)`,
      master_medicine_id:  null,
      matched_variant:     null,
      suggested_master_id: topMatch.master.master_medicine_id,
      suggestions: highConfidenceMatches.slice(0, 3).map((m) => ({
        master_medicine_id: m.master.master_medicine_id,
        master_key:         m.master.master_key,
        generic_name:       m.master.generic_name,
        variant_id:         m.variant.variant_id,
        variant_name:       m.variant.name,
        confidence:         m.totalScore,
        reasons:            m.reasons,
      })),
    };
  }

  if (confidence >= THRESHOLDS.AUTO_LINK) {
    let bestMatch = topMatch;

    if (highConfidenceMatches.length > 1) {
      const shopPackSize = shopMedicine.pack_size || "";
      const shopName     = shopMedicine.name;
      const shopStrength = extractStrength(shopName);

      if (shopStrength) {
        const withDelta = highConfidenceMatches.map((m) => ({
          ...m,
          strengthDelta:
            m.variant.strength_value != null
              ? Math.abs(m.variant.strength_value - shopStrength.value)
              : Infinity,
        }));

        const minDelta      = Math.min(...withDelta.map((m) => m.strengthDelta));
        const afterStrength = withDelta.filter((m) => m.strengthDelta === minDelta);

        if (afterStrength.length === 1) {
          bestMatch = afterStrength[0];
        } else if (shopPackSize) {
          const withPackScore = afterStrength.map((m) => ({
            ...m,
            packScore: calculatePackScore(shopPackSize, m.variant.pack_size),
          }));
          const maxPackScore = Math.max(...withPackScore.map((m) => m.packScore));
          const afterPack    = withPackScore.filter((m) => m.packScore === maxPackScore);

          if (afterPack.length === 1) {
            bestMatch = afterPack[0];
          } else {
            const withNameSim = afterPack.map((m) => ({
              ...m,
              nameSim: calculateNameSimilarityScore(shopName, m.variant.name),
            }));
            withNameSim.sort((a, b) => b.nameSim - a.nameSim);
            bestMatch = withNameSim[0];
          }
        } else {
          const withNameSim = afterStrength.map((m) => ({
            ...m,
            nameSim: calculateNameSimilarityScore(shopName, m.variant.name),
          }));
          withNameSim.sort((a, b) => b.nameSim - a.nameSim);
          bestMatch = withNameSim[0];
        }
      } else if (shopPackSize) {
        const withPackScore = highConfidenceMatches.map((m) => ({
          ...m,
          packScore: calculatePackScore(shopPackSize, m.variant.pack_size),
        }));
        const maxPackScore = Math.max(...withPackScore.map((m) => m.packScore));
        const afterPack    = withPackScore.filter((m) => m.packScore === maxPackScore);

        if (afterPack.length === 1) {
          bestMatch = afterPack[0];
        } else {
          const withNameSim = afterPack.map((m) => ({
            ...m,
            nameSim: calculateNameSimilarityScore(shopName, m.variant.name),
          }));
          withNameSim.sort((a, b) => b.nameSim - a.nameSim);
          bestMatch = withNameSim[0];
        }
      } else {
        const withNameSim = highConfidenceMatches.map((m) => ({
          ...m,
          nameSim: calculateNameSimilarityScore(shopName, m.variant.name),
        }));
        withNameSim.sort((a, b) => b.nameSim - a.nameSim);
        bestMatch = withNameSim[0];
      }
    }

    return {
      status:             "AUTO_LINKED",
      confidence:         bestMatch.totalScore,
      reason:             bestMatch.reasons.join(", "),
      master_medicine_id: bestMatch.master.master_medicine_id,
      master_key:         bestMatch.master.master_key,
      matched_variant: {
        variant_id: bestMatch.variant.variant_id,
        sku_id:     bestMatch.variant.sku_id,
        name:       bestMatch.variant.name,
        brand:      bestMatch.variant.brand,
      },
      suggestions: [],
    };
  }

  if (confidence >= THRESHOLDS.SUGGEST) {
    return {
      status:              "PENDING",
      confidence,
      reason:              `Needs review: ${topMatch.reasons.join(", ")}`,
      master_medicine_id:  null,
      matched_variant:     null,
      suggested_master_id: topMatch.master.master_medicine_id,
      suggestions: matches.slice(0, 3).map((m) => ({
        master_medicine_id: m.master.master_medicine_id,
        master_key:         m.master.master_key,
        generic_name:       m.master.generic_name,
        variant_id:         m.variant.variant_id,
        variant_name:       m.variant.name,
        confidence:         m.totalScore,
        reasons:            m.reasons,
      })),
    };
  }

  return {
    status:             "NO_MATCH",
    confidence,
    reason:             "Match confidence too low",
    master_medicine_id: null,
    matched_variant:    null,
    suggestions: matches.slice(0, 3).map((m) => ({
      master_medicine_id: m.master.master_medicine_id,
      master_key:         m.master.master_key,
      generic_name:       m.master.generic_name,
      variant_id:         m.variant.variant_id,
      variant_name:       m.variant.name,
      confidence:         m.totalScore,
      reasons:            m.reasons,
    })),
  };
}

// ══════════════════════════════════════════════════════════════
// bulkCheckImportRows
// ══════════════════════════════════════════════════════════════

export async function bulkCheckImportRows(rows) {
  if (!rows || rows.length === 0) {
    return {
      results: [],
      stats:   { total: 0, autoLinked: 0, pending: 0, noMatch: 0 },
    };
  }

  const results = [];
  const stats   = { total: rows.length, autoLinked: 0, pending: 0, noMatch: 0 };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (!row.name || !row.name.trim()) {
      results.push({ rowIndex: i, status: "SKIP", reason: "No product name", master_medicine_id: null });
      continue;
    }

    try {
      const matchResult = await checkSingleMedicine({
        name:         row.name,
        manufacturer: row.manufacturer || row.mfac,
        generic_name: row.generic_name || row.genericName,
        pack_size:    row.pack_size || row.packSize || "",
      });

      if (matchResult.status === "AUTO_LINKED")  stats.autoLinked++;
      else if (matchResult.status === "PENDING")  stats.pending++;
      else if (matchResult.status === "NO_MATCH") stats.noMatch++;

      results.push({ rowIndex: i, originalName: row.name, originalManufacturer: row.manufacturer || row.mfac, ...matchResult });
    } catch (error) {
      results.push({ rowIndex: i, status: "ERROR", reason: error.message, master_medicine_id: null });
    }
  }

  return { results, stats };
}

// ══════════════════════════════════════════════════════════════
// REMAINING EXPORTS
// ══════════════════════════════════════════════════════════════

export async function autoLinkToMasterCatalog(shopMedicine) {
  const result = await checkSingleMedicine(shopMedicine);
  if (result.status === "AUTO_LINKED") {
    return {
      type:            "AUTO_LINKED",
      confidence:      result.confidence,
      master_id:       result.master_medicine_id,
      master_key:      result.master_key,
      matched_variant: result.matched_variant,
    };
  }
  if (result.status === "PENDING" && result.suggestions.length > 0) {
    return { type: "SUGGESTED", suggestions: result.suggestions };
  }
  return { type: "NONE" };
}

export async function getSuggestionsForMedicine(medicineId) {
  const medicine = await prisma.medicine.findUnique({
    where:  { medicine_id: medicineId },
    select: {
      medicine_id:        true,
      name:               true,
      generic_name:       true,
      manufacturer:       true,
      link_status:        true,
      master_medicine_id: true,
    },
  });
  if (!medicine) throw new Error("Medicine not found");

  if (medicine.master_medicine_id) {
    const master = await prisma.masterMedicine.findUnique({
      where:   { master_medicine_id: medicine.master_medicine_id },
      include: {
        variants: {
          take:   5,
          select: { sku_id: true, name: true, brand: true, mrp: true },
        },
      },
    });
    return {
      isLinked:    true,
      linkStatus:  medicine.link_status,
      currentLink: master
        ? {
            master_id:    master.master_medicine_id,
            master_key:   master.master_key,
            generic_name: master.generic_name,
            type:         master.type,
            variants:     master.variants,
          }
        : null,
      suggestions: [],
    };
  }

  const result = await checkSingleMedicine(medicine);
  return {
    isLinked:    false,
    linkStatus:  medicine.link_status,
    currentLink: null,
    suggestions: result.suggestions || [],
  };
}

export async function manuallyLinkMedicine(
  medicineId,
  masterMedicineId,
  userId,
  userType = "CADMIN",
  variantId = null,
) {
  const master = await prisma.masterMedicine.findUnique({
    where: { master_medicine_id: masterMedicineId },
  });
  if (!master) throw new Error("Master medicine not found");

  let targetVariant = null;
  if (variantId) {
    targetVariant = await prisma.masterMedicineVariant.findUnique({
      where:  { variant_id: variantId },
      select: { variant_id: true, sku_id: true },
    });
  }
  if (!targetVariant) {
    targetVariant = await prisma.masterMedicineVariant.findFirst({
      where:   { master_medicine_id: masterMedicineId },
      orderBy: { mrp: "asc" },
      select:  { variant_id: true, sku_id: true },
    });
  }

  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data:  {
      master_medicine_id:    masterMedicineId,
      linked_variant_id:     targetVariant?.variant_id ?? null,
      linked_variant_sku:    targetVariant?.sku_id ?? null,
      link_status:           "MANUAL_LINKED",
      link_confidence_score: 100,
      link_rejected:         false,
      linked_at:             new Date(),
      linked_by_id:          userId,
      linked_by_type:        userType,
      suggested_master_id:   null,
      suggestion_reason:     null,
    },
  });

  if (targetVariant?.variant_id) {
    const med = await prisma.medicine.findUnique({
      where:  { medicine_id: medicineId },
      select: { branch_id: true, shop_id: true },
    });
    if (med?.branch_id) {
      try {
        await createListingForMedicine(medicineId, med.branch_id, med.shop_id, targetVariant.variant_id);
      } catch { /* non-critical */ }
    }
  }

  return {
    success:  true,
    medicine: updated,
    linkedTo: {
      master_id:    master.master_medicine_id,
      master_key:   master.master_key,
      generic_name: master.generic_name,
      variant_id:   targetVariant?.variant_id ?? null,
      variant_sku:  targetVariant?.sku_id ?? null,
    },
  };
}

export async function unlinkMedicine(medicineId, reject = false) {
  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data:  {
      master_medicine_id:    null,
      linked_variant_id:     null,
      linked_variant_sku:    null,
      link_status:           reject ? "UNLINKED" : "PENDING",
      link_confidence_score: null,
      link_rejected:         reject,
      linked_at:             null,
      linked_by_id:          null,
      linked_by_type:        null,
    },
  });

  const med = await prisma.medicine.findUnique({
    where:  { medicine_id: medicineId },
    select: { branch_id: true },
  });
  if (med?.branch_id) {
    try {
      await handleMedicineUnlinked(medicineId, med.branch_id);
    } catch { /* non-critical */ }
  }

  return {
    success:  true,
    medicine: updated,
    action:   reject ? "rejected" : "unlinked",
  };
}

export async function bulkAutoLinkMedicines(shopId, branchId = null) {
  const where = {
    shop_id:       shopId,
    link_status:   "PENDING",
    link_rejected: false,
  };
  if (branchId) where.branch_id = branchId;

  const pendingMedicines = await prisma.medicine.findMany({
    where,
    select: {
      medicine_id:  true,
      name:         true,
      generic_name: true,
      manufacturer: true,
      branch_id:    true,
    },
  });

  const results = {
    total:      pendingMedicines.length,
    autoLinked: 0,
    suggested:  0,
    noMatch:    0,
    errors:     [],
  };

  for (const medicine of pendingMedicines) {
    try {
      const linkResult = await checkSingleMedicine(medicine);

      if (linkResult.status === "AUTO_LINKED") {
        await prisma.medicine.update({
          where: { medicine_id: medicine.medicine_id },
          data:  {
            master_medicine_id:    linkResult.master_medicine_id,
            linked_variant_id:     linkResult.matched_variant?.variant_id ?? null,
            linked_variant_sku:    linkResult.matched_variant?.sku_id ?? null,
            link_status:           "AUTO_LINKED",
            link_confidence_score: linkResult.confidence,
            linked_at:             new Date(),
            linked_by_type:        "SYSTEM",
            suggestion_reason:     linkResult.reason,
          },
        });

        if (linkResult.matched_variant?.variant_id && medicine.branch_id) {
          try {
            await createListingForMedicine(medicine.medicine_id, medicine.branch_id, shopId, linkResult.matched_variant.variant_id);
          } catch { /* non-critical */ }
        }

        results.autoLinked++;
      } else if (linkResult.status === "PENDING") {
        await prisma.medicine.update({
          where: { medicine_id: medicine.medicine_id },
          data:  {
            link_status:           "SUGGESTED",
            link_confidence_score: linkResult.confidence,
            suggested_master_id:   linkResult.suggested_master_id,
            suggestion_reason:     linkResult.reason,
          },
        });
        results.suggested++;
      } else {
        results.noMatch++;
      }
    } catch (error) {
      results.errors.push({
        medicine_id: medicine.medicine_id,
        name:        medicine.name,
        error:       error.message,
      });
    }
  }

  return results;
}

export async function getUnlinkedMedicines(shopId, branchId = null, options = {}) {
  const { status = "PENDING", page = 1, limit = 20 } = options;
  
  const where = {
    shop_id:            shopId,
    master_medicine_id: null,
    is_active:          true,
  };
  
  if (branchId) {
    where.branch_id = branchId;
  }

  // ── DYNAMIC LINK REJECTED FILTER ──
  if (status && status !== "ALL") {
    where.link_status = status;
    if (status === "UNLINKED") {
      // If looking specifically for ignored/rejected medicines
      where.link_rejected = true;
    } else {
      where.link_rejected = false;
    }
  } else if (status === "ALL") {
    // For the resubmit modal: include both PENDING and rejected (UNLINKED) medicines
    // We do not restrict by link_rejected here
  } else {
    // Default fallback
    where.link_rejected = false;
  }

  const skip = (page - 1) * limit;
  const [medicines, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
      select: {
        medicine_id:           true,
        name:                  true,
        generic_name:          true,
        manufacturer:          true,
        link_status:           true,
        link_confidence_score: true,
        resubmission_count:    true,
        last_resubmitted_at:   true,
        created_at:            true,
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.medicine.count({ where }),
  ]);

  return {
    medicines,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function searchMasterCatalog(query, limit = 10) {
  if (!query || query.length < 2) return [];
  const searchTerm = query.trim();

  const masters = await prisma.masterMedicine.findMany({
    where: {
      is_active: true,
      OR: [
        { generic_name: { contains: searchTerm, mode: "insensitive" } },
        { master_key:   { contains: searchTerm, mode: "insensitive" } },
        {
          variants: {
            some: {
              OR: [
                { name:  { contains: searchTerm, mode: "insensitive" } },
                { brand: { contains: searchTerm, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    },
    include: {
      variants: {
        take:   3,
        select: { sku_id: true, name: true, brand: true, mrp: true },
      },
    },
    take:    limit,
    orderBy: { generic_name: "asc" },
  });

  return masters.map((m) => ({
    master_id:        m.master_medicine_id,
    master_key:       m.master_key,
    generic_name:     m.generic_name,
    type:             m.type,
    form:             m.form,
    variant_count:    m.variant_count,
    preview_variants: m.variants,
  }));
}

// ══════════════════════════════════════════════════════════════
// RESUBMIT ELIGIBLE COUNT (for badge on button)
// ══════════════════════════════════════════════════════════════

export async function getResubmitEligibleCount(shopId, branchId) {
  const where = {
    shop_id: shopId,
    is_active: true,
    // Everything that is NOT successfully linked
    OR: [
      { master_medicine_id: null },
      { link_status: { notIn: ["AUTO_LINKED", "MANUAL_LINKED"] } },
    ],
  };

  if (branchId) {
    where.branch_id = branchId;
  }

  const count = await prisma.medicine.count({ where });
  return count;
}

// ══════════════════════════════════════════════════════════════
// RESUBMIT MEDICINES FOR REVIEW
// ══════════════════════════════════════════════════════════════

export async function resubmitMedicinesForReview(
  shopId,
  branchId,
  medicineIds,
  userId,
  userName,
) {
  if (!medicineIds || medicineIds.length === 0) {
    throw new Error("No medicine IDs provided");
  }

  if (!branchId) {
    throw new Error("Branch selection is required");
  }



  ///reset after-----24 hr
  const COOLDOWN_MS = 0; 
  // const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
  const now = new Date();
  const cooldownCutoff = new Date(now.getTime() - COOLDOWN_MS);

  // ── Fetch all requested medicines ──
  const medicines = await prisma.medicine.findMany({
    where: {
      medicine_id: { in: medicineIds },
      shop_id: shopId,
      branch_id: branchId,
      is_active: true,
    },
    select: {
      medicine_id: true,
      name: true,
      generic_name: true,
      manufacturer: true,
      master_medicine_id: true,
      link_status: true,
      link_rejected: true,
      resubmission_count: true,
      last_resubmitted_at: true,
    },
  });

  if (medicines.length === 0) {
    return {
      totalRequested: medicineIds.length,
      processed: 0,
      skippedLinked: 0,
      skippedCooldown: 0,
      notFound: medicineIds.length,
      results: [],
    };
  }

  const results = {
    totalRequested: medicineIds.length,
    processed: 0,
    skippedLinked: 0,
    skippedCooldown: 0,
    notFound: medicineIds.length - medicines.length,
    details: [],
  };

  const eligibleIds = [];

  // ── Triage each medicine ──
  for (const med of medicines) {
    // Skip already linked
    const isLinked =
      med.master_medicine_id &&
      ["AUTO_LINKED", "MANUAL_LINKED"].includes(med.link_status);

    if (isLinked) {
      results.skippedLinked++;
      results.details.push({
        medicine_id: med.medicine_id,
        name: med.name,
        action: "SKIPPED_LINKED",
        reason: "Already linked to catalog",
      });
      continue;
    }

    // Skip cooldown
    if (
      med.last_resubmitted_at &&
      new Date(med.last_resubmitted_at) > cooldownCutoff
    ) {
      results.skippedCooldown++;
      const hoursAgo = Math.round(
        (now - new Date(med.last_resubmitted_at)) / (1000 * 60 * 60),
      );
      results.details.push({
        medicine_id: med.medicine_id,
        name: med.name,
        action: "SKIPPED_COOLDOWN",
        reason: `Resubmitted ${hoursAgo}h ago (24h cooldown)`,
      });
      continue;
    }

    eligibleIds.push(med.medicine_id);
  }

  if (eligibleIds.length === 0) {
    return results;
  }

  // ── Process eligible medicines in a transaction ──
  await prisma.$transaction(async (tx) => {
    for (const medId of eligibleIds) {
      // 1. Reset flags and increment counter
      await tx.medicine.update({
        where: { medicine_id: medId },
        data: {
          link_rejected: false,
          link_status: "PENDING",
          suggested_master_id: null,
          suggested_variant_id: null,
          suggestion_reason: null,
          link_confidence_score: null,
          resubmission_count: { increment: 1 },
          last_resubmitted_at: now,
        },
      });

      // 2. Re-run auto-matcher for fresh catalog match
      const med = medicines.find((m) => m.medicine_id === medId);
      try {
        const matchResult = await checkSingleMedicine({
          name: med.name,
          manufacturer: med.manufacturer,
          generic_name: med.generic_name,
        });

        if (matchResult.status === "AUTO_LINKED") {
          await tx.medicine.update({
            where: { medicine_id: medId },
            data: {
              master_medicine_id: matchResult.master_medicine_id,
              linked_variant_id:
                matchResult.matched_variant?.variant_id ?? null,
              linked_variant_sku:
                matchResult.matched_variant?.sku_id ?? null,
              link_status: "AUTO_LINKED",
              link_confidence_score: matchResult.confidence,
              linked_at: now,
              linked_by_type: "SYSTEM",
              suggestion_reason: matchResult.reason,
            },
          });

          results.details.push({
            medicine_id: medId,
            name: med.name,
            action: "AUTO_LINKED",
            reason: `Re-matched: ${matchResult.reason}`,
          });
        } else if (matchResult.status === "PENDING") {
          await tx.medicine.update({
            where: { medicine_id: medId },
            data: {
              link_status: "SUGGESTED",
              link_confidence_score: matchResult.confidence,
              suggested_master_id: matchResult.suggested_master_id,
              suggestion_reason: matchResult.reason,
            },
          });

          results.details.push({
            medicine_id: medId,
            name: med.name,
            action: "SUGGESTED",
            reason: `Fresh match: ${matchResult.reason}`,
          });
        } else {
          results.details.push({
            medicine_id: medId,
            name: med.name,
            action: "PENDING",
            reason: "No catalog match — awaiting CAdmin review",
          });
        }
      } catch (matchError) {
        // Matcher failed — medicine stays PENDING, which is fine
        results.details.push({
          medicine_id: medId,
          name: med.name,
          action: "PENDING",
          reason: `Matcher error: ${matchError.message}`,
        });
      }

      results.processed++;
    }

    // 3. Audit log — single entry for the batch
    await audit.log({
      action: audit.AuditAction.MEDICINE_RESUBMITTED_FOR_REVIEW,
      entity_type: audit.EntityType.MEDICINE,
      entity_id: null,
      actor_type: audit.ActorType.ERP_USER,
      actor_id: userId,
      shop_id: shopId,
      branch_id: branchId,
      reason_code: "USER_REQUEST",
      metadata: {
        medicine_ids: eligibleIds,
        medicine_names: eligibleIds.map(
          (id) => medicines.find((m) => m.medicine_id === id)?.name,
        ),
        count: eligibleIds.length,
        skipped_linked: results.skippedLinked,
        skipped_cooldown: results.skippedCooldown,
        resubmitted_by: userName || userId,
      },
    });
  });

    // 4. Notify CAdmin catalog team (defensive fire-and-forget wrapper)
  if (results.processed > 0) {
    try {
      const dispatchPromise = notify({
        type: NOTIFICATION_EVENTS.MEDICINE_RESUBMITTED,
        context: {
          shop_id: shopId,
          branch_id: branchId,
          count: results.processed,
          resubmitted_by: userName || "Shop User",
        },
      });

      // Safely catch only if a valid promise is returned
      if (dispatchPromise && typeof dispatchPromise.catch === "function") {
        dispatchPromise.catch((err) =>
          console.error("[Notification] MEDICINE_RESUBMITTED failed asynchronously:", err)
        );
      }
    } catch (dispatchError) {
      // Prevents notification configuration issues from crashing the database write
      console.warn("[Notification] MEDICINE_RESUBMITTED sync dispatch failed safely:", dispatchError.message);
    }
  }

  return results;
}