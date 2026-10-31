
# Medicine Linking System — Current Architecture

> **Status**: Live in production
> **Last Updated**: October 2026
> **Scope**: This document covers the existing medicine linking system from data origin to admin review. It does not cover planned enhancements.

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Data Origin — 1mg Scraping Pipeline](#2-data-origin--1mg-scraping-pipeline)
3. [Data Model](#3-data-model)
4. [Master Catalog Seeding](#4-master-catalog-seeding)
5. [Pharmacy Inventory Import Flow](#5-pharmacy-inventory-import-flow)
6. [Matching Algorithm](#6-matching-algorithm)
7. [Cross-Shop Link Propagation](#7-cross-shop-link-propagation)
8. [Admin Review Workflow](#8-admin-review-workflow)
9. [Database Indexes](#9-database-indexes)
10. [Current State & Statistics](#10-current-state--statistics)
11. [Known Limitations](#11-known-limitations)

---

## 1. Purpose

Cureli operates a multi-tenant pharmacy marketplace. Each pharmacy imports its inventory from local ERP systems (e.g., Medisoft) or supplier-provided Excel files. These imports contain medicine names in abbreviated, inconsistent formats (e.g., `"CILNIDIP 10 TAB"`, `"meganeuron od plus cap"`, `"losar a tab"`).

The **Master Medicine Catalog** is a centralized, standardized database of Indian pharmaceutical products scraped from 1mg.com. It contains 658,966 variants grouped under 175,471 master medicines with images, compositions, pricing, and categorization.

The **Medicine Linking System** connects each pharmacy's local medicine record to the correct entry in the Master Catalog. This link enables:

- **Marketplace listings**: Customers see standardized names, images, descriptions, and prices from the catalog
- **Search**: Customers can find medicines by generic name, brand, or composition regardless of how the pharmacy entered it
- **Prescription validation**: Prescription-required flags come from the catalog
- **Cross-shop consistency**: The same medicine across different pharmacies resolves to the same catalog entry

---

## 2. Data Origin — 1mg Scraping Pipeline

### 2.1 Source

All master catalog data originates from **1mg.com**, one of India's largest online pharmacy platforms. The data was scraped using a custom pipeline called **CCSP** (Cureli Catalog Scraping Pipeline).

### 2.2 Raw Data Structure

The scraper produces two categories of data:

**Drugs** (prescription medicines):
```json
{
  "sku_id": "10005",
  "name": "Topinate Cream",
  "composition": "Clobetasol (0.05% w/w)",
  "therapeutic_class": "DERMA",
  "manufacturer": null,
  "marketer": "Systopic Laboratories Pvt Ltd",
  "pack_size": "30.0 gm in 1 tube",
  "price": { "mrp": 78.75, "selling_price": 68.4, "discount_percent": 13 }
}
```

**OTC** (over-the-counter products):
```json
{
  "sku_id": "10418",
  "name": "Vitafol 5mg Tablet for Folic Acid Deficiency",
  "manufacturer": "Innova Captab Ltd.",
  "marketer": "Cipla Ltd",
  "category": { "l1": "Vitamins & Nutrition" }
}
```

### 2.3 CCSP Transformation Pipeline

Located in `ccsp/src/`. The pipeline transforms raw scraped data into structured records:

| Module | File | Purpose |
|---|---|---|
| **Drug Transformer** | `transformers/drugTransformer.js` | Parses drug records: extracts composition, strength, brand, form |
| **OTC Transformer** | `transformers/otcTransformer.js` | Parses OTC records with different naming conventions |
| **Extractor** | `utils/extractor.js` | NLP-like extraction of strength values, form words, brand tokens, composition arrays |
| **Master Key Generator** | `utils/masterKey.js` | Generates grouping keys (see §2.4) |
| **Normalizer** | `utils/normalizer.js` | Text normalization |
| **Image Copier** | `utils/imageCopier.js` | Downloads and maps product images |
| **Validator** | `utils/validator.js` | Data quality checks |

### 2.4 Master Key Generation

The `master_key` is the grouping identifier that clusters variants of the same medicine together.

**Format**: `{composition}_{form}` (lowercase, alphanumeric + underscores)

**Examples**:
| Composition | Form | Master Key |
|---|---|---|
| Clobetasol | Cream | `clobetasol_cream` |
| Clobetasol | Ointment | `clobetasol_ointment` |
| Fluoxetine | Capsule | `fluoxetine_capsule` |

**Special cases**:
- **Bio-Combination products**: `biocombination02_tablet`
- **No composition available**: Falls back to cleaned product name + form, e.g., `vitafol5mg_tablet`

**Variant Key**: `{master_key}_{strength}`, e.g., `clobetasol_cream_0.05%`

### 2.5 Transformed Output Structure

After CCSP processing, each record looks like:

```json
{
  "sku_id": "10005",
  "type": "DRUG",
  "name": "Topinate Cream",
  "brand": "Topinate",
  "strength": { "value": 0.05, "unit": "%" },
  "form": "Cream",
  "composition": [
    { "name": "Clobetasol", "strength": "0.05% w/w" }
  ],
  "master_key": "clobetasol_cream",
  "variant_key": "clobetasol_cream_0.05%",
  "manufacturer": null,
  "marketer": "Systopic Laboratories Pvt Ltd",
  "price": { "mrp": 78.75, "selling_price": 68.4, "discount_percent": 13 },
  "pack_size": "30.0 gm in 1 tube",
  "prescription_required": true,
  "primary_category": "DERMA",
  "images": [
    { "url": "images/10005/img_00_high.jpg", "type": "PRIMARY" },
    { "url": "images/10005/img_01_high.jpg", "type": "GALLERY" }
  ]
}
```

### 2.6 Catalog Statistics

| Metric | Count |
|---|---|
| Total variants | 658,966 |
| Drug variants | 381,974 |
| OTC variants | 276,992 |
| Unique master keys | 175,471 |
| Multi-variant masters | 42,108 |
| Drug categories | 22 |
| OTC categories | 34 |
| Drug forms | 24 |
| OTC forms | 24 |

---

## 3. Data Model

### 3.1 Entity Relationship

```
MasterMedicine (1) ──── (N) MasterMedicineVariant
     │                              │
     └──── (N) MasterMedicineImage  └──── (N) MasterMedicineImage
                                           
Medicine (shop-level) ──── links to ──── MasterMedicine + MasterMedicineVariant
```

### 3.2 MasterMedicine

The parent record representing a unique pharmaceutical product (e.g., "Clobetasol Cream").

| Field | Type | Description |
|---|---|---|
| `master_medicine_id` | UUID (PK) | Primary key |
| `master_key` | String (unique) | Grouping key from CCSP, e.g., `clobetasol_cream` |
| `generic_name` | String | Human-readable name, e.g., "Clobetasol Cream" |
| `type` | Enum: `DRUG`, `OTC` | Medicine category |
| `form` | String | Dosage form: Tablet, Capsule, Cream, Gel, Drop, Syrup, etc. |
| `composition` | JSON | Array of active ingredients: `[{"name": "Clobetasol", "strength": "0.05% w/w"}]` |
| `prescription_required` | Boolean | Whether the medicine requires a prescription |
| `primary_category` | String | Therapeutic category, e.g., "DERMA", "CARDIAC", "OPHTHAL" |
| `variant_count` | Integer | Number of variants under this master |
| `image_status` | String | Image availability status |

### 3.3 MasterMedicineVariant

A specific SKU/brand/pack-size variant of a master medicine (e.g., "Topinate Cream 30gm by Systopic").

| Field | Type | Description |
|---|---|---|
| `variant_id` | UUID (PK) | Primary key |
| `master_medicine_id` | UUID (FK) | Parent master |
| `sku_id` | String (unique) | 1mg SKU identifier, e.g., "10005" |
| `name` | String | Full product name, e.g., "Topinate Cream" |
| `brand` | String | Extracted brand name, e.g., "Topinate" |
| `composition` | JSON | Same structure as master, variant-specific |
| `strength_value` | Float | Numeric strength, e.g., 0.05 |
| `strength_unit` | String | Unit, e.g., "%", "mg", "ml" |
| `manufacturer` | String | Manufacturing company |
| `marketer` | String | Marketing company |
| `pack_size` | String | Pack description, e.g., "30.0 gm in 1 tube" |
| `mrp` | Float | Maximum retail price |
| `selling_price` | Float | Discounted selling price |
| `discount_percent` | Float | Discount percentage |
| `description` | Text | Full product description from 1mg |
| `images` | String[] | Array of storage keys for variant-specific images |

### 3.4 MasterMedicineImage

| Field | Type | Description |
|---|---|---|
| `image_id` | UUID (PK) | Primary key |
| `master_medicine_id` | UUID (FK) | Parent master |
| `sku_id` | String | Associated variant SKU |
| `url` | String | Storage key (not full URL), e.g., `medicine_images/10005/img_00_high.jpg` |
| `type` | Enum: `PRIMARY`, `GALLERY` | Image role |
| `sequence` | Integer | Display order |
| `source` | Enum: `SCRAPED`, `UPLOADED` | Origin |

### 3.5 Medicine (Shop-Level Record)

Each pharmacy's local medicine entry. This is the record that gets linked to the catalog.

| Field | Type | Description |
|---|---|---|
| `medicine_id` | UUID (PK) | Primary key |
| `shop_id` | UUID (FK) | Owning pharmacy |
| `branch_id` | UUID (FK) | Specific branch |
| `name` | String | Pharmacy's local name, e.g., "CILNIDIP 10 TAB" |
| `generic_name` | String | If provided by pharmacy |
| `manufacturer` | String | Manufacturer as entered by pharmacy |
| `category` | String | Local category |
| `sub_category` | String | Local sub-category |
| `schedule` | String | Drug schedule (H, H1, X, etc.) |
| `hsn_code` | String | HSN tax code |
| `pack_size` | String | Pack size as entered |
| **Link Fields** | | |
| `master_medicine_id` | UUID (FK, nullable) | Linked master catalog entry |
| `linked_variant_id` | UUID (FK, nullable) | Linked specific variant |
| `linked_variant_sku` | String (nullable) | Linked variant SKU |
| `link_status` | Enum | See §3.6 |
| `link_confidence_score` | Float | Match confidence 0-100 |
| `link_rejected` | Boolean | Whether a suggestion was rejected |
| `suggested_master_id` | UUID (nullable) | Pending suggestion |
| `suggested_variant_id` | UUID (nullable) | Pending suggestion variant |
| `suggestion_reason` | String (nullable) | Why this suggestion was made |
| `normalized_name` | String | Cleaned version of the name |
| `resubmission_count` | Integer | Times re-queued for matching |

**Unique constraint**: `[shop_id, branch_id, name, manufacturer]` — prevents duplicate medicines within a branch.

### 3.6 LinkStatus Enum

| Value | Meaning |
|---|---|
| `PENDING` | Not yet matched against the catalog |
| `AUTO_LINKED` | Auto-matched by the algorithm with high confidence (≥92%) |
| `SUGGESTED` | Algorithm found a possible match (75-91%) but needs human confirmation |
| `MANUAL_LINKED` | Manually confirmed by an admin or pharmacy user |
| `UNLINKED` | Intentionally kept separate (no catalog match or deliberate choice) |

---

## 4. Master Catalog Seeding

### 4.1 Seed Script

**File**: `backend/prisma/seeds/masterCatalog.seed.js`

**Source**: CCSP output directory on local HDD (`CCSP_DATA_DIR` env var), containing paginated JSON files and an `_index.json` manifest.

### 4.2 Seeding Process

The seed runs in two passes:

**Pass 1 — Build Master Map**:
1. Reads all CCSP page files sequentially
2. Groups variants by `master_key`
3. Builds generic name from composition: `"Clobetasol"` or `"Methylcobalamin + Vitamin B6 + Benfotiamine"`
4. Appends form: `"Clobetasol Cream"`
5. Escalates `type` to `DRUG` if any variant is a drug
6. Escalates `prescription_required` to `true` if any variant requires it
7. Inserts all master records into `master_medicines` table
8. Caches `master_key → master_medicine_id` mapping in memory

**Pass 2 — Insert Variants and Images**:
1. Re-reads all CCSP pages
2. For each SKU, looks up `master_medicine_id` from cache (O(1))
3. Inserts variant into `master_medicine_variants`
4. Inserts image records into `master_medicine_images`
5. Image URLs stored as storage keys: `medicine_images/{sku_id}/{filename}`

### 4.3 Re-run Behavior

Safe to re-run. Truncates all three tables (`master_medicine_images`, `master_medicine_variants`, `master_medicines`) in FK-safe order, then re-seeds from scratch. Requires `--force` flag if data already exists.

### 4.4 Image Storage

- **Database stores**: Storage keys only (e.g., `medicine_images/10005/img_00_high.jpg`)
- **Runtime resolution**: Backend resolves keys to full CloudFront CDN URLs via `assetUrl.service.js`
- **Primary image selection**: Prefers `phase1_main.jpg`, falls back to `img_00_high.jpg`
- **Gallery images**: All `img_*_high.jpg` files except the primary

---

## 5. Pharmacy Inventory Import Flow

### 5.1 Entry Point

**File**: `backend/src/modules/inventory-import/inventoryImport.service.js`

Pharmacies upload inventory spreadsheets through the ERP interface. Files come from:
- Local ERP exports (e.g., Medisoft)
- Supplier-provided Excel files for new stock

These files contain medicine names in the pharmacy's local format — abbreviated, inconsistent, and without any standard drug codes or 1mg SKU IDs.

### 5.2 Import Pipeline

```
Upload File
    │
    ▼
┌─────────────┐
│   PARSING   │  Detect software format, map columns, extract rows
└──────┬──────┘
       ▼
┌──────────────┐
│ DEDUPLICATING│  Group by name+manufacturer, merge duplicate rows
└──────┬───────┘
       ▼
┌──────────────┐
│ CATALOG CHECK│  Match each unique medicine against master catalog
└──────┬───────┘
       ▼
┌──────────────┐
│  VALIDATING  │  Check for data quality issues, detect batch conflicts
└──────┬───────┘
       ▼
┌──────────────┐
│    READY     │  Build write plan, await admin review
└──────┬───────┘
       ▼
┌──────────────┐
│   WRITING    │  Create medicines, inventory records, marketplace listings
└──────────────┘
```

### 5.3 Catalog Check Phase (Detail)

For each unique medicine in the import:

**Step 1 — Cross-Shop Pre-Check**:
```js
findCrossShopLink(name, manufacturer, excludeShopId)
```
Searches other shops for an exact match (case-insensitive) on `name` AND `manufacturer` that is already linked (`AUTO_LINKED` or `MANUAL_LINKED`). If found, reuses that link immediately — skips the matching algorithm entirely.

**Step 2 — Algorithm Match** (if no cross-shop link):
```js
checkSingleMedicine({ name, manufacturer, generic_name, pack_size })
```
Runs the full matching algorithm (see §6). Returns one of:
- `AUTO_LINKED` — confidence ≥ 92%, link is applied automatically
- `PENDING` — confidence 75-91%, suggestion stored for human review
- `NO_MATCH` — confidence < 65% or no candidates found

### 5.4 Write Plan Construction

Based on catalog check results, each medicine gets an action:

| Action | Condition | Result |
|---|---|---|
| `use_existing` | Medicine already exists in this branch | Reuse existing medicine record |
| `create_linked` | Algorithm returned AUTO_LINKED | Create medicine with catalog link |
| `create_suggested` | Algorithm returned PENDING | Create medicine with suggestion fields populated |
| `create_unlinked` | Algorithm returned NO_MATCH | Create medicine without any catalog link |

### 5.5 Post-Write Propagation

After the write completes, any newly `AUTO_LINKED` medicines trigger cross-shop propagation via `setImmediate` (fire-and-forget). See §7.

---

## 6. Matching Algorithm

### 6.1 Location

**File**: `backend/src/modules/medicines/linking.service.js`

### 6.2 Configuration

| Constant | Value | Purpose |
|---|---|---|
| `AUTO_LINK_THRESHOLD` | 92 | Score ≥ this → auto-link |
| `SUGGEST_THRESHOLD` | 75 | Score ≥ this → suggest for review |
| `MIN_MATCH_THRESHOLD` | 65 | Score ≥ this → consider at all |

### 6.3 Scoring Weights

| Component | Weight | What It Measures |
|---|---|---|
| **Name** | 40% | Similarity between pharmacy name and catalog variant name |
| **Strength** | 25% | Match on numeric strength value and unit |
| **Composition** | 20% | Overlap in active ingredients |
| **Manufacturer** | 15% | Match on manufacturer or marketer name |

**Total possible score**: 100

### 6.4 Candidate Retrieval

**Function**: `findPotentialMatches(name, manufacturer, genericName)`

**Method**: `ILIKE '%term%'` queries against `MasterMedicineVariant` and `MasterMedicine` tables.

**Search targets**:
- Variant `name` (contains)
- Variant `brand` (contains)
- Master `generic_name` (contains)

**Result limit**: 20-40 candidates per query

**Note**: This uses standard PostgreSQL `ILIKE` pattern matching. Trigram indexes exist on these columns (see §9) but are not currently utilized by this query path.

### 6.5 Name Matching (40 points)

1. **Normalization**: Both names are lowercased, trimmed, and stripped of common form words (tablet, capsule, cream, etc.)
2. **Brand token extraction**: Extracts brand-like tokens from the pharmacy name
3. **Levenshtein distance**: Computes edit distance between normalized names
4. **Token overlap**: Counts shared word tokens between pharmacy name and catalog name
5. **Scoring**: Combines Levenshtein similarity and token overlap into a 0-40 score

### 6.6 Strength Matching (25 points)

1. **Strength inference**: Attempts to extract numeric strength from the pharmacy name (e.g., "CILNIDIP **10** TAB" → 10mg)
2. **Comparison**: Compares inferred strength against variant's `strength_value` and `strength_unit`
3. **Scoring**: Exact match = 25, close match (same value, different unit) = partial, no match = 0

### 6.7 Composition Matching (20 points)

1. **Parse pharmacy composition**: Extracts active ingredient names from the pharmacy's composition string (if available)
2. **Compare with catalog**: Checks overlap between pharmacy composition and catalog variant's `composition` JSON array
3. **Scoring**: Full overlap = 20, partial = proportional, no overlap = 0

### 6.8 Manufacturer Matching (15 points)

1. **Normalize**: Lowercase, trim both manufacturer strings
2. **Compare**: Check if pharmacy manufacturer matches variant's `manufacturer` or `marketer` field
3. **Contains check**: Also checks if one contains the other (handles abbreviations like "GSK" vs "Glaxo SmithKline")
4. **Scoring**: Exact = 15, contains = 10, no match = 0

### 6.9 Pack Size Comparison

Used as a tiebreaker when multiple variants score similarly. Compares pack count (e.g., "10" from "10.0 tablets in 1 strip" vs "10" from pharmacy pack size).

### 6.10 Decision Flow

```
findPotentialMatches() → top 20-40 candidates
    │
    ▼
For each candidate:
    computeScore() → 0-100
    │
    ▼
Sort by score descending
    │
    ▼
Top score ≥ 92?  → AUTO_LINKED (link applied)
Top score ≥ 75?  → PENDING (suggestion stored)
Top score ≥ 65?  → PENDING (lower confidence suggestion)
Top score < 65?  → NO_MATCH
```

### 6.11 Batch Processing

**Function**: `bulkAutoLinkMedicines(shopId, branchId)`

Iterates all `PENDING` medicines for a shop/branch and re-runs the matcher. Used for re-processing after catalog updates.

**Function**: `resubmitMedicinesForReview(medicineIds)`

Resets link status and re-runs the matcher for specific medicines. Increments `resubmission_count`.

---

## 7. Cross-Shop Link Propagation

### 7.1 Location

**File**: `backend/src/modules/medicines/linkPropagation.service.js`

### 7.2 Purpose

When a medicine is linked to a catalog variant in one shop, automatically link all identical medicines in other shops to the same variant. This avoids redundant matching work across the multi-tenant system.

### 7.3 Matching Rule

**Case-insensitive exact match on `name` AND `manufacturer`.** No fuzzy matching. One letter difference = no propagation.

### 7.4 findCrossShopLink

Called during the import flow *before* the matching algorithm runs.

**Query**: Finds the most recently linked medicine in any other shop where:
- `name` matches exactly (case-insensitive)
- `manufacturer` matches exactly (case-insensitive)
- `link_status` is `AUTO_LINKED` or `MANUAL_LINKED`
- `linked_variant_id` is not null

**Returns**: The existing link details (master ID, variant ID, SKU, confidence) or null.

### 7.5 propagateLinkToOtherShops

Called via `setImmediate` after a new link is created (fire-and-forget, non-blocking).

**Steps**:
1. **Find targets**: All unlinked medicines across all shops matching exact name + manufacturer
2. **Bulk update**: Set `link_status = AUTO_LINKED`, `link_confidence_score = 100`, `linked_by_type = PROPAGATED`
3. **Create marketplace listings**: For each target with a branch, create a marketplace listing
4. **Audit log**: Single batch entry recording the propagation
5. **Notifications**: Per-shop notification about newly linked medicines

---

## 8. Admin Review Workflow

### 8.1 Admin Panel Location

**Path**: CAdmin → Master Medicines → Master Medicine Catalog

### 8.2 Dashboard Tabs

| Tab | Description |
|---|---|
| **Master Catalog** | Browse all 178K+ master medicines |
| **Mapping** | View and manage pharmacy-to-catalog links |
| **Images** | Manage catalog images |
| **Unmapped** | Medicines with no catalog match (9,889) |
| **Needs Review** | Algorithm suggestions awaiting human decision (8,187) |
| **History** | Audit trail of all linking actions (31,065) |

### 8.3 Unmapped View

Shows pharmacy medicines that the algorithm could not match to any catalog entry.

**Displayed per record**:
- Pharmacy name (e.g., "meganeuron od plus cap")
- Manufacturer (e.g., "ARISTO")
- Type (DRUG/OTC)
- Number of occurrences across shops
- Shop distribution (which pharmacies have this medicine)
- Date range (first seen, last seen)
- Name variations (different spellings across shops)
- Potential matches (if any were found below threshold)

**Admin actions**:
- **Match**: Manually search the catalog and link to a specific variant
- **Create New**: Create a new master medicine entry if the product genuinely doesn't exist in the catalog

### 8.4 Needs Review View

Shows algorithm suggestions in the 70-91% confidence range.

**Displayed per record**:
- Pharmacy name and manufacturer
- Suggested catalog match (master name + form)
- Confidence percentage
- Source shop and branch

**Filters**:
- Confidence level: High (90%+), Medium (70-89%)
- Shop
- Date range

### 8.5 Review Match Detail

When an admin clicks on a suggested match:

**Shop Medicine Details** (left panel):
- Name, manufacturer, pack size, HSN code
- Shop and branch
- Occurrence count
- Composition as entered by pharmacy

**Catalog Match** (right panel):
- Master generic name and master_key
- Type, form, prescription status, category
- Price range
- Variant count
- Marketer

**Field Comparison**:
- Side-by-side comparison of name, manufacturer, pack size, composition
- Highlights matches (✓) and mismatches (≠)

**Closest Variant**:
- The specific variant the algorithm selected
- Name, brand, strength, marketer, MRP, pack size, SKU

**All Variants** (expandable):
- Full list of all variants under the matched master
- Admin can change the variant selection

**Admin actions**:
- **Accept Match**: Confirm the link → status becomes `MANUAL_LINKED`
- **Reject**: Reject the suggestion → status becomes `UNLINKED`
- **Change**: Select a different variant from the catalog

---

## 9. Database Indexes

### 9.1 Trigram Indexes

**File**: `backend/scripts/applyTrigrmIndexes.js`

PostgreSQL `pg_trgm` extension is enabled with GIN indexes on:

| Index | Table | Column |
|---|---|---|
| `idx_mmv_name_trgm` | `master_medicine_variants` | `name` |
| `idx_mmv_brand_trgm` | `master_medicine_variants` | `brand` |
| `idx_mmv_manufacturer_trgm` | `master_medicine_variants` | `manufacturer` |
| `idx_mmv_marketer_trgm` | `master_medicine_variants` | `marketer` |
| `idx_mm_generic_name_trgm` | `master_medicines` | `generic_name` |

**Current utilization**: These indexes are created and active in the database, but the matching algorithm's `findPotentialMatches` function uses `ILIKE '%term%'` queries which do not leverage trigram indexes. The indexes are available for future query optimization.

### 9.2 Standard Indexes

From the Prisma schema:
- `MasterMedicineVariant.sku_id` — unique index
- `Medicine.[shop_id, branch_id, name, manufacturer]` — unique composite index
- Various foreign key indexes on `master_medicine_id`, `linked_variant_id`, `shop_id`, `branch_id`

---

## 10. Current State & Statistics

### 10.1 Master Catalog

| Metric | Count |
|---|---|
| Master medicines in DB | 178,453 |
| Verified masters | 2 |
| Raw (unverified) masters | 171,249 |
| Masters without images | 7,202 |

### 10.2 Linking Status

| Status | Count | Description |
|---|---|---|
| **Linked** | 31,065 | Successfully linked (AUTO_LINKED + MANUAL_LINKED) |
| **Unmapped** | 9,889 | No catalog match found by algorithm |
| **Needs Review** | 8,187 | Algorithm found suggestions, awaiting human decision |
| — High confidence (90%+) | 2,423 | Algorithm is fairly sure, but still in review queue |
| — Medium confidence (70-89%) | 5,764 | Algorithm is uncertain |
| — Below 70% | ~70 | Very low confidence |
| **Total pending** | ~18,076 | Unmapped + Needs Review |

### 10.3 Active Shops

4 shops are actively importing medicines:
- Medtrust Pharma
- Fathima Medicals
- Cureli Medicals
- Cureli Pharmacy (with sub-branches)

### 10.4 Unmapped Record Characteristics

Based on admin panel sampling, unmapped records are predominantly:
- **Type**: DRUG (allopathic medicines)
- **Naming pattern**: Highly abbreviated brand names with form suffixes
- **Examples**:
  - `"meganeuron od plus cap"` (ARISTO) — Methylcobalamin combination capsule
  - `"lyserd nanotech gel"` (COMED) — Anti-inflammatory gel
  - `"lycored cap"` (JAGSON) — Lycopene capsule
  - `"losar tab 50mg"` (UNICHE) — Losartan 50mg tablet
  - `"losar a tab"` (UNICHE) — Losartan + Amlodipine tablet
  - `"fenlin 30ml"` (ASTON) — Paracetamol suspension
  - `"defoflam tab"` (JOHNLEE) — Anti-inflammatory tablet
  - `"cremosun syp"` (SLS) — Sunscreen/calcium syrup
  - `"ampivon plus cap"` (SWATI) — Antibiotic capsule

**Root cause of unmapped status**: The algorithm's `ILIKE '%term%'` queries fail to find candidates because the pharmacy name (e.g., "meganeuron") shares no substring with the catalog's generic name (e.g., "Methylcobalamin + Vitamin B6 + Benfotiamine + Alpha Lipoic Acid + Folic Acid + Biotin Capsule"). The brand name and generic name are completely different strings.

### 10.5 High-Confidence Review Queue Issues

Sampling of the 90%+ confidence review queue reveals algorithm weaknesses:

| Pharmacy Name | Matched To | Score | Issue |
|---|---|---|---|
| Mac Rabonik DSR (ERIS) | Mac Gel | 92% | Brand prefix "Mac" dominates; DSR capsule ≠ Gel |
| MAC GD3 TAB (BIOTICS) | Mac Gel | 92% | Same prefix issue; Tablet ≠ Gel |
| Mahacef Plus Tab. (MANKIND) | Cefixime Drop | 92% | Tablet ≠ Drop |
| Mamy Poko (S) | Mamy Poko Medium 4s | 92% | Diaper product, not a medicine |
| Macfolate Tab. (MACLEO) | L-Methyl Folate Capsule | 92% | Multiple candidates, ambiguous variant selection |

These records are correctly held in the review queue (not auto-linked), but the high confidence scores could mislead a reviewer into accepting incorrect matches.

---

## 11. Known Limitations

### 11.1 Retrieval Limitation

The `findPotentialMatches` function relies on `ILIKE '%term%'` substring matching. This fails when:
- The pharmacy uses a brand name that shares no substring with the catalog's generic name (e.g., "Meganeuron" vs "Methylcobalamin")
- The pharmacy name is heavily abbreviated (e.g., "CILNIDIP" vs "Cilnidipine")
- The pharmacy uses local/regional brand names not present in the 1mg catalog

**Impact**: ~9,889 records (55% of pending) have zero candidates retrieved, making scoring irrelevant.

### 11.2 Scoring Limitations

- **Brand prefix dominance**: Short shared prefixes (e.g., "Mac") can produce disproportionately high name scores
- **Form mismatch tolerance**: The algorithm does not hard-block form mismatches (e.g., Tablet matched to Gel can still score 92%)
- **Strength inference fragility**: Extracting strength from abbreviated names like "CILNIDIP 10 TAB" is heuristic and error-prone
- **Composition matching gap**: Pharmacy imports rarely include structured composition data; the composition field is often empty or in a non-standard format

### 11.3 Trigram Index Underutilization

GIN trigram indexes exist on all key search columns but are not used by the matching algorithm. The `ILIKE` queries perform sequential scans instead of leveraging the trigram indexes for fuzzy similarity search.

### 11.4 No Cross-Reference Data

The system has no mapping between brand names and generic names. When a pharmacy enters "Losar," the system cannot resolve this to "Losartan" without a brand-to-generic lookup table or external knowledge source.

### 11.5 Propagation Coupling

Cross-shop propagation uses exact name + manufacturer matching. If the first shop's link is incorrect (e.g., accepted by a reviewer in error), that incorrect link propagates to all other shops with the same medicine name, amplifying the error.

### 11.6 No Audit of Existing Links

The 31,065 already-linked records have no automated verification mechanism. If any were incorrectly linked (either by algorithm auto-link or human error), they remain undetected until a customer complaint or manual audit.

---

