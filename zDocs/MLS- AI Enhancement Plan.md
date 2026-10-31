
# Medicine Linking System — AI Enhancement Plan

> **Status**: Proposed — Awaiting Approval
> **Last Updated**: October 2026
> **Prerequisite**: [Medicine Linking System — Current Architecture](./medicine-linking-system.md)
> **Scope**: This document covers the planned AI-powered enhancement to the medicine linking system. It presents two tiers for comparison.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Tier Comparison at a Glance](#2-tier-comparison-at-a-glance)
3. [Shared Architecture (Both Tiers)](#3-shared-architecture-both-tiers)
4. [Tier A — Cost-Optimized](#4-tier-a--cost-optimized)
5. [Tier B — Maximum Accuracy](#5-tier-b--maximum-accuracy)
6. [Detailed Pricing Breakdown](#6-detailed-pricing-breakdown)
7. [Development Timeline](#7-development-timeline)
8. [Operational Performance](#8-operational-performance)
9. [Safety Guardrails](#9-safety-guardrails)
10. [Admin UI Flow](#10-admin-ui-flow)
11. [Database Changes](#11-database-changes)
12. [Risk Assessment](#12-risk-assessment)
13. [Recommendation](#13-recommendation)

---

## 1. Executive Summary

The current medicine linking system uses a rule-based string-matching algorithm that successfully links ~31,000 pharmacy records but leaves ~18,000 records unresolved (9,889 unmapped + 8,187 pending review). The algorithm also produces false high-confidence matches (e.g., "Mac Rabonik DSR" → "Mac Gel" at 92%) that waste reviewer time and risk patient safety if accepted.

This enhancement introduces a **dual-layer AI verification system** that:

1. **Resolves the backlog** — Matches unmapped and pending records using pharmaceutical knowledge that string matching cannot access (brand-to-generic mapping, abbreviation understanding, composition reasoning)
2. **Audits existing links** — Reviews all 31,065 already-linked records to catch incorrect matches before they cause customer harm
3. **Handles future imports** — Automatically processes new medicines from ongoing pharmacy imports
4. **Proposes new catalog entries** — For medicines genuinely absent from the 1mg catalog, generates pre-filled master records for human approval

Two tiers are presented below. Both use the same architectural pattern (dual-layer AI with independent verification). They differ in model selection, tool availability, and depth of analysis.

---

## 2. Tier Comparison at a Glance

| Dimension | Tier A — Cost-Optimized | Tier B — Maximum Accuracy |
|---|---|---|
| **Layer 1 Model** | GPT-4o-mini | GPT-4o |
| **Layer 2 Model** | Claude 3.5 Haiku | Claude Sonnet 4 |
| **Web Search** | ❌ No | ✅ Yes (Tavily API) |
| **Tool Use** | Basic (catalog search only) | Full (catalog + web + composition parser) |
| **Reasoning Depth** | Standard | Extended (chain-of-thought) |
| **Audit Strategy** | Single-pass (Layer 1 only) | Two-pass (screen + deep dual-layer) |
| **New Record Proposals** | Basic (catalog knowledge only) | Full (catalog + web verification) |
| **One-Time Cost (Backlog + Audit)** | **~$25-35** | **~$500-650** |
| **Ongoing Monthly Cost** | **~$0.20/month** | **~$5-8/month** |
| **Development Time** | **3 weeks** | **5 weeks** |
| **Backlog Processing Time** | **~45 minutes** | **~2.5-3.5 hours** |
| **Audit Processing Time** | **~50 minutes** | **~75-90 minutes** |
| **Expected Backlog Resolution** | ~65-75% | ~85-92% |
| **Expected Audit Accuracy** | ~88-92% | ~96-99% |
| **False Positive Rate** | Moderate (~5-8%) | Very Low (~1-2%) |

---

## 3. Shared Architecture (Both Tiers)

### 3.1 Dual-Layer Verification Pattern

Both tiers use the same fundamental architecture: two independent AI models evaluate each medicine record. Layer 2 does **not** see Layer 1's reasoning — only its conclusion. This prevents confirmation bias and catches errors that a single model would miss.

```
┌───────────────────────────────────────────────────────┐
│                   INPUT RECORD                        │
│  Pharmacy: "meganeuron od plus cap" | Mfr: ARISTO    │
└───────────────────────┬───────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            ▼                       │
    ┌───────────────┐               │
    │   LAYER 1     │               │
    │   MATCHER     │               │
    │               │               │
    │ Searches      │               │
    │ catalog,      │               │
    │ ranks         │               │
    │ candidates,   │               │
    │ returns top   │               │
    │ pick + score  │               │
    └───────┬───────┘               │
            │                       │
            │ Conclusion only:      │
            │ "Match: Methylco-     │
            │  balamin Capsule      │
            │  SKU 857632 (94%)"    │
            │                       │
            │ (reasoning HIDDEN)    │
            ▼                       │
    ┌───────────────┐               │
    │   LAYER 2     │               │
    │   REVIEWER    │               │
    │               │               │
    │ Independently │               │
    │ evaluates:    │               │
    │ "Is this      │               │
    │  correct?"    │               │
    └───────┬───────┘               │
            │                       │
            ▼                       │
    ┌───────────────┐               │
    │   DECISION    │               │
    │   ENGINE      │               │
    │               │               │
    │ AGREE → Link  │               │
    │ DISAGREE →    │               │
    │   Human       │               │
    └───────────────┘               │
```

### 3.2 Module Structure

```
backend/src/modules/medicines/
├── ai/
│   ├── orchestrator.service.js       ← Queue management, batch control, concurrency
│   ├── layer1.matcher.service.js     ← Layer 1: Find and rank matches
│   ├── layer2.reviewer.service.js    ← Layer 2: Independent verification
│   ├── decisionEngine.service.js     ← Combine both layers, apply thresholds
│   ├── proposalGenerator.service.js  ← New master record creation
│   ├── audit.service.js              ← Review already-linked records
│   ├── prompts/
│   │   ├── matcher.system.js         ← Layer 1 system prompt
│   │   ├── reviewer.system.js        ← Layer 2 system prompt
│   │   ├── proposal.system.js        ← New record generation prompt
│   │   └── audit.system.js           ← Audit verification prompt
│   ├── tools/
│   │   ├── catalogSearch.js          ← Trigram + composition + master_key search
│   │   ├── webSearch.js              ← Internet lookup (Tier B only)
│   │   └── compositionParser.js      ← Normalize pharmacy composition strings
│   └── config.js                     ← Model names, thresholds, concurrency, API keys
├── linking.service.js                ← MODIFY: Activate trigram query path
└── linkPropagation.service.js        ← MODIFY: Exclude AI_LINKED from propagation
```

### 3.3 Three Processing Jobs

| Job | Input | Trigger |
|---|---|---|
| **Backlog Processor** | 18,076 records (unmapped + pending + high-confidence review) | Manual: Admin clicks "Process Backlog" |
| **Linked Record Auditor** | 31,065 already-linked records | Manual: Admin clicks "Audit Linked" |
| **Import Hook** | New medicines from each inventory import | Automatic: After import write completes |

### 3.4 Decision Matrix (Both Tiers)

| Layer 1 | Layer 2 | Outcome | LinkStatus | Human Action |
|---|---|---|---|---|
| MATCH ≥95% | AGREE ≥95% | ✅ Auto-link | `AI_LINKED` | None (logged) |
| MATCH 90-94% | AGREE ≥90% | 🟢 High suggest | `AI_SUGGESTED` | One-click approve |
| MATCH 85-89% | AGREE ≥85% | 🟡 Medium suggest | `AI_SUGGESTED` | Review + approve |
| MATCH any | DISAGREE | 🔴 Conflict | `AI_CONFLICT` | Full review (both reasonings shown) |
| PROPOSE_NEW | AGREE | 🆕 Proposed | `AI_PROPOSED` | Approve new record |
| PROPOSE_NEW | DISAGREE | ⚠️ Uncertain | `AI_UNCERTAIN` | Manual research |
| NO_MATCH | NO_MATCH | ⬜ Unmapped | `AI_UNMAPPED` | Manual |

### 3.5 Trigram Query Activation (Both Tiers)

The existing `pg_trgm` GIN indexes on `master_medicine_variants.name`, `brand`, `manufacturer`, `marketer`, and `master_medicines.generic_name` will be activated by replacing the current `ILIKE '%term%'` queries in `findPotentialMatches` with PostgreSQL trigram similarity operators:

```sql
-- Current (ignores trigram index):
WHERE name ILIKE '%meganeuron%'

-- New (uses trigram index):
WHERE name % 'meganeuron'
   OR similarity(name, 'meganeuron') > 0.3
ORDER BY similarity(name, 'meganeuron') DESC
```

This single change is expected to recover candidates for 40-60% of the currently unmapped records by enabling fuzzy matching on abbreviated names (e.g., "CILNIDIP" → "Cilnidipine", "losar" → "Losartan").

---

## 4. Tier A — Cost-Optimized

### 4.1 Model Selection

| Layer | Model | Provider | Input Price | Output Price | Why |
|---|---|---|---|---|---|
| **Layer 1** | GPT-4o-mini | OpenAI | $0.15/1M tokens | $0.60/1M tokens | Fast, knows pharma well, 128K context |
| **Layer 2** | Claude 3.5 Haiku | Anthropic | $0.25/1M tokens | $1.25/1M tokens | Independent model family, fast, cheap |

### 4.2 Capabilities

**What Tier A CAN do**:
- Understand pharmaceutical abbreviations (cap, tab, syp, inj, od, dsr, sr)
- Map common Indian brand names to generics (Losar → Losartan, Pan → Pantoprazole)
- Detect form mismatches (Tab ≠ Drop ≠ Gel)
- Cross-reference manufacturer/marketer
- Score candidates using composition overlap
- Identify non-medicine products (diapers, cosmetics)
- Generate basic new record proposals from catalog knowledge

**What Tier A CANNOT do**:
- Search the internet for obscure or regional brands
- Verify composition data against external sources
- Handle deeply ambiguous cases where multiple generics could match
- Provide detailed chain-of-thought reasoning for complex matches

### 4.3 Prompt Strategy

**Layer 1 Prompt** (~800 tokens input per record):
- System prompt: Pharmaceutical matching expert, Indian market focus
- User prompt: Pharmacy record + top 20 catalog candidates (pre-fetched via trigram search)
- Output format: JSON with action, match details, confidence, brief reasoning

**Layer 2 Prompt** (~600 tokens input per record):
- System prompt: Independent pharmaceutical verifier, focus on safety
- User prompt: Pharmacy record + Layer 1's conclusion (no reasoning)
- Output format: JSON with verdict, confidence, safety flags

### 4.4 Audit Approach

**Single-pass**: Layer 1 (GPT-4o-mini) reviews all 31,065 linked records. Each record gets a quick verification: "Is pharmacy medicine X correctly linked to catalog variant Y?"

- Records flagged as suspicious → queued for human review
- Records confirmed → logged, no action needed
- No Layer 2 involvement in audit (cost savings)

### 4.5 Limitations

- **No web search**: If a medicine isn't in the 1mg catalog and the model doesn't know it from training data, it stays unmapped
- **Shallower reasoning**: Complex multi-ingredient combinations or unusual brand names may be missed
- **Single-layer audit**: Without Layer 2 cross-checking, some incorrect existing links may pass undetected
- **Higher conflict rate**: More records will land in the "AI_CONFLICT" bucket requiring human review

---

## 5. Tier B — Maximum Accuracy

### 5.1 Model Selection

| Layer | Model | Provider | Input Price | Output Price | Why |
|---|---|---|---|---|---|
| **Layer 1** | GPT-4o | OpenAI | $2.50/1M tokens | $10.00/1M tokens | Best reasoning, tool use, 128K context, deep pharma knowledge |
| **Layer 2** | Claude Sonnet 4 | Anthropic | $3.00/1M tokens | $15.00/1M tokens | Independent model family, strongest verification, different training biases |

**Why different providers**: OpenAI and Anthropic models are trained on different data distributions with different biases. When both independently agree on a match, the probability of a correlated error drops dramatically. Using two models from the same provider (e.g., GPT-4o + GPT-4o-mini) would share similar blind spots.

### 5.2 Capabilities

**Everything Tier A can do, plus**:
- **Web search**: Queries the internet for medicines not found in the catalog (Tavily API)
- **Extended reasoning**: Chain-of-thought analysis for complex multi-ingredient combinations
- **Tool use**: Dynamically decides when to search the catalog, when to search the web, when to parse composition
- **Deep audit**: Two-pass verification of existing links with independent cross-checking
- **Verified new records**: New master record proposals cross-referenced against web sources
- **Edge case handling**: Recognizes regional brands, Ayurvedic/Unani products, combination drugs with 5+ ingredients

### 5.3 Web Search Integration

**Provider**: Tavily API
- Purpose-built for AI agents
- Returns clean, structured search results
- Pricing: $0.01 per search, 1,000 free searches/month
- Latency: ~1-2 seconds per search

**When web search triggers**:
1. Layer 1 catalog search returns zero results
2. Layer 1 catalog search returns results but all below 60% similarity
3. Layer 2 disagrees with Layer 1 and wants to independently verify
4. New record proposal needs composition verification against external sources

**Search query patterns**:
- `"{medicine_name}" {manufacturer} composition India`
- `"{medicine_name}" {manufacturer} 1mg OR pharmeasy OR netmeds`
- `"{medicine_name}" salt composition drug India`

**Safety rule**: Web search results are treated as **hints**, not facts. Any composition data from the web is cross-checked against known pharmaceutical patterns before being used. The AI is instructed to flag any web-sourced data it's not confident about.

### 5.4 Prompt Strategy

**Layer 1 Prompt** (~1,500 tokens input per record):
- System prompt: Senior pharmaceutical matching expert with tool access, Indian market specialization
- Tools available: `catalog_search()`, `web_search()`, `parse_composition()`
- User prompt: Pharmacy record (full details including HSN, pack size, composition)
- The model dynamically decides which tools to call and how many searches to run
- Output format: JSON with action, match details, confidence, detailed reasoning chain, risks, web sources used

**Layer 2 Prompt** (~1,200 tokens input per record):
- System prompt: Independent pharmaceutical safety auditor, zero trust in Layer 1
- Tools available: `catalog_search()`, `web_search()` (can do its own independent verification)
- User prompt: Pharmacy record + Layer 1's conclusion only (action + matched variant + confidence)
- The model independently verifies by searching the catalog and/or web
- Output format: JSON with verdict, confidence, detailed reasoning, safety flags, variant corrections if needed

### 5.5 Audit Approach

**Two-pass**:

**Pass 1 — Screening** (GPT-4o-mini, all 31,065 records):
- Quick verification: "Does this link look correct? Flag anything suspicious."
- Fast and cheap — catches obvious errors (form mismatches, category mismatches, non-medicines)
- Expected flags: ~2,000-3,000 records (~7-10%)

**Pass 2 — Deep Audit** (GPT-4o + Claude Sonnet, flagged records only):
- Full dual-layer verification on each flagged record
- Both models independently verify the link using catalog search and web search
- Produces detailed reasoning for why the link is suspected wrong
- Expected critical findings: ~100-300 records

**Why two-pass**: Running full dual-layer on all 31K records would cost ~$500+. The screening pass catches 90%+ of issues at 1/50th the cost. Only genuinely ambiguous cases get the expensive deep audit.

### 5.6 New Record Proposals

When neither layer can find a catalog match:

1. Layer 1 uses web search to identify the medicine (generic name, composition, form, category)
2. Layer 1 generates a complete master record proposal with all fields pre-filled
3. Layer 2 independently verifies the proposal against web sources
4. If both agree → proposal queued for human approval with full sourcing
5. If they disagree → flagged as uncertain with both analyses shown

**Example proposal**:
```json
{
  "action": "PROPOSE_NEW",
  "pharmacy_record": {
    "name": "fenlin 30ml",
    "manufacturer": "ASTON"
  },
  "proposal": {
    "generic_name": "Paracetamol",
    "type": "DRUG",
    "form": "Suspension",
    "composition": [{"name": "Paracetamol", "strength": "250mg/5ml"}],
    "prescription_required": false,
    "primary_category": "ANALGESIC",
    "variants": [{
      "name": "Fenlin Suspension",
      "brand": "Fenlin",
      "strength_value": 250,
      "strength_unit": "mg/5ml",
      "manufacturer": "Aston Pharmaceuticals",
      "pack_size": "30ml"
    }]
  },
  "sources": [
    "https://www.1mg.com/drugs/fenlin-suspension-...",
    "https://pharmeasy.in/..."
  ],
  "confidence": 87,
  "layer1_reasoning": "Web search confirms Fenlin is a Paracetamol oral suspension by Aston...",
  "layer2_verdict": "AGREE — independently verified on PharmEasy and DrugBank"
}
```

---

## 6. Detailed Pricing Breakdown

### 6.1 Tier A — Cost-Optimized

#### One-Time Costs

| Operation | Records | Model | Avg Input Tokens | Avg Output Tokens | Input Cost | Output Cost | Total |
|---|---|---|---|---|---|---|---|
| **Backlog — Layer 1** | 18,076 | GPT-4o-mini | 800 | 400 | $2.17 | $4.34 | $6.51 |
| **Backlog — Layer 2** | 18,076 | Claude Haiku | 600 | 300 | $2.71 | $6.78 | $9.49 |
| **Audit — Layer 1 only** | 31,065 | GPT-4o-mini | 600 | 250 | $2.80 | $4.66 | $7.46 |
| **New proposals** | ~300 | GPT-4o-mini | 1,000 | 600 | $0.05 | $0.11 | $0.16 |
| **Total one-time** | | | | | | | **~$24** |

#### Ongoing Monthly Costs (est. 500 new medicines/month)

| Operation | Records | Model | Monthly Cost |
|---|---|---|---|
| Layer 1 | 500 | GPT-4o-mini | $0.10 |
| Layer 2 | 500 | Claude Haiku | $0.13 |
| **Total monthly** | | | **~$0.23** |

#### Annual Projection

| Year | Cost |
|---|---|
| Year 1 (backlog + 12 months) | ~$27 |
| Year 2+ | ~$3/year |

---

### 6.2 Tier B — Maximum Accuracy

#### One-Time Costs

| Operation | Records | Model | Avg Input Tokens | Avg Output Tokens | Input Cost | Output Cost | Total |
|---|---|---|---|---|---|---|---|
| **Backlog — Layer 1** | 18,076 | GPT-4o | 1,500 | 800 | $67.79 | $144.61 | $212.40 |
| **Backlog — Layer 2** | 18,076 | Claude Sonnet | 1,200 | 600 | $65.07 | $162.68 | $227.75 |
| **Backlog — Web search** | ~3,000 | Tavily API | — | — | — | — | $30.00 |
| **Audit — Pass 1 screen** | 31,065 | GPT-4o-mini | 600 | 250 | $2.80 | $4.66 | $7.46 |
| **Audit — Pass 2 Layer 1** | ~2,500 | GPT-4o | 1,500 | 700 | $9.38 | $17.50 | $26.88 |
| **Audit — Pass 2 Layer 2** | ~2,500 | Claude Sonnet | 1,200 | 500 | $9.00 | $18.75 | $27.75 |
| **New proposals** | ~500 | GPT-4o | 2,000 | 1,200 | $2.50 | $6.00 | $8.50 |
| **New proposals — web** | ~500 | Tavily API | — | — | — | — | $5.00 |
| **Total one-time** | | | | | | | **~$546** |

#### Ongoing Monthly Costs (est. 500 new medicines/month)

| Operation | Records | Model | Monthly Cost |
|---|---|---|---|
| Layer 1 | 500 | GPT-4o | $3.13 |
| Layer 2 | 500 | Claude Sonnet | $3.00 |
| Web search | ~50 | Tavily | $0.50 |
| **Total monthly** | | | **~$6.63** |

#### Annual Projection

| Year | Cost |
|---|---|
| Year 1 (backlog + audit + 12 months) | ~$626 |
| Year 2+ | ~$80/year |

---

### 6.3 Cost Comparison Summary

| | Tier A | Tier B | Difference |
|---|---|---|---|
| **One-time** | ~$24 | ~$546 | +$522 |
| **Monthly** | ~$0.23 | ~$6.63 | +$6.40 |
| **Year 1 total** | ~$27 | ~$626 | +$599 |
| **Year 2+ total** | ~$3 | ~$80 | +$77 |

**Context**: $546 is approximately the cost of **one day** of a junior data entry operator in India. The AI processes 49,000+ records (backlog + audit) in a few hours with higher accuracy than a human could achieve in weeks.

---

## 7. Development Timeline

### 7.1 Tier A — 3 Weeks

| Week | Tasks | Deliverable |
|---|---|---|
| **Week 1** | OpenAI + Anthropic SDK setup, Layer 1 matcher service, Layer 2 reviewer service, prompt engineering, trigram query activation in `linking.service.js` | Working dual-layer pipeline on individual records |
| **Week 2** | Orchestrator with batch queue, concurrency control (10 workers), decision engine, audit service (single-pass), error handling, retry logic | Full batch processing pipeline |
| **Week 3** | Admin UI (progress bar, results dashboard, conflict review, audit dashboard), new `LinkStatus` enum values, propagation guard, rollback mechanism, testing with real data | Production-ready module |

### 7.2 Tier B — 5 Weeks

| Week | Tasks | Deliverable |
|---|---|---|
| **Week 1** | Same as Tier A Week 1, but with GPT-4o tool-use integration (function calling for catalog search, web search, composition parsing) | Layer 1 with full tool access |
| **Week 2** | Claude Sonnet Layer 2 with independent tool use, web search service (Tavily integration), extended prompt engineering with chain-of-thought | Full dual-layer with tools |
| **Week 3** | Orchestrator, batch queue, concurrency control, decision engine, two-pass audit service (screening + deep), new record proposal generator with web verification | Complete processing pipeline |
| **Week 4** | Admin UI (full dashboard with all result categories, conflict review with dual reasoning display, proposal approval flow, audit dashboard with critical/suspected/confirmed tabs), batch management, rollback | Full UI |
| **Week 5** | End-to-end testing with real data from all 4 shops, prompt tuning based on edge cases discovered during testing, load testing (DB + API rate limits), documentation, deployment | Battle-tested production module |

### 7.3 Timeline Comparison

| | Tier A | Tier B |
|---|---|---|
| **Total dev time** | 3 weeks | 5 weeks |
| **Additional weeks** | — | +2 weeks |
| **What the extra 2 weeks buy** | — | Web search, tool use, deep audit, proposal verification, extended testing |

---

## 8. Operational Performance

### 8.1 Processing Speed Per Record

| Operation | Tier A | Tier B |
|---|---|---|
| Layer 1 API call | ~0.5-1s | ~3-5s (with tool calls: 5-8s) |
| Layer 2 API call | ~0.5-1s | ~2-4s (with tool calls: 4-7s) |
| Web search (when triggered) | N/A | ~1-2s |
| **Total per record** | **~1-2s** | **~5-10s** |

### 8.2 Backlog Processing (18,076 records, 10 concurrent workers)

| Metric | Tier A | Tier B |
|---|---|---|
| Effective throughput | ~5-8 records/sec | ~1-2 records/sec |
| **Total time** | **~35-50 minutes** | **~2.5-3.5 hours** |
| Can run during business hours? | Yes (low API load) | Yes (rate-limited, non-blocking) |
| Database load | Moderate (trigram queries) | Higher (more queries per record) |

### 8.3 Audit Processing (31,065 records)

| Metric | Tier A | Tier B |
|---|---|---|
| Pass 1 (all records) | ~50 min (GPT-4o-mini) | ~50 min (GPT-4o-mini screening) |
| Pass 2 (flagged only) | N/A | ~25-35 min (~2,500 records, dual-layer) |
| **Total time** | **~50 minutes** | **~75-90 minutes** |

### 8.4 Import Hook (Ongoing, per import)

| Metric | Tier A | Tier B |
|---|---|---|
| Typical import size | 50-200 unique medicines | 50-200 unique medicines |
| Processing time | ~1-3 minutes | ~5-15 minutes |
| Impact on import flow | None (background job) | None (background job) |

### 8.5 API Rate Limits

| Provider | Tier A Usage | Tier B Usage | Free Tier | Paid Limit |
|---|---|---|---|---|
| OpenAI | ~25M tokens (backlog) | ~100M tokens (backlog+audit) | None | 10M RPM (Tier 3+) |
| Anthropic | ~16M tokens (backlog) | ~80M tokens (backlog+audit) | None | 5M RPM (Scale) |
| Tavily | 0 | ~3,500 searches | 1,000/month | Unlimited |

**Note**: Both tiers stay well within standard API rate limits. No special rate limit increases needed. Concurrency is controlled at the application level (10 workers max).

---

## 9. Safety Guardrails

### 9.1 Shared Guardrails (Both Tiers)

| Guard | Description | Enforcement |
|---|---|---|
| **Temperature = 0** | All API calls use deterministic output | API parameter |
| **No auto-propagation** | `AI_LINKED` records do NOT propagate to other shops until human confirms | `linkPropagation.service.js` filter |
| **Form hard-block** | Tab ≠ Drop ≠ Gel ≠ Syrup ≠ Capsule. Form mismatch blocks auto-link regardless of AI confidence | Rule in `decisionEngine.service.js` |
| **Composition cross-check** | Active ingredients must match between pharmacy record and catalog variant | Rule in `decisionEngine.service.js` |
| **Schedule boundary** | Rx drugs cannot auto-link to OTC catalog entries and vice versa | Rule in `decisionEngine.service.js` |
| **Full audit log** | Every AI decision logged: input, both layers' outputs, final decision, timestamps, token usage, model versions | `audit.service.js` |
| **Batch rollback** | Every batch gets a `batch_id`. Admin can undo entire batch with one click | `orchestrator.service.js` |
| **Confidence floor** | No auto-link below 95% combined confidence from both layers | `decisionEngine.service.js` |

### 9.2 Tier B Additional Guardrails

| Guard | Description |
|---|---|
| **Web source citation** | All web-sourced data includes URLs for human verification |
| **Composition sanity check** | AI-proposed compositions are validated against known pharmaceutical patterns (e.g., Paracetamol max 1000mg per dose) |
| **Dual-provider independence** | Layer 1 (OpenAI) and Layer 2 (Anthropic) use different model families to prevent correlated errors |
| **Audit escalation** | Critical audit findings (wrong drug, wrong strength on Rx) are flagged for immediate human attention, not batched |

---

## 10. Admin UI Flow

### 10.1 AI Matching Hub (New Page)

```
CAdmin → Master Medicines → AI Matching Hub

┌─────────────────────────────────────────────────────────────┐
│  🤖 AI Medicine Matching Hub                                │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ 📦 BACKLOG       │  │ 🔍 LINKED AUDIT  │                 │
│  │                  │  │                  │                 │
│  │ Unmapped:  9,889 │  │ Linked:   31,065 │                 │
│  │ Pending:   8,187 │  │                  │                 │
│  │ Total:    18,076 │  │                  │                 │
│  │                  │  │                  │                 │
│  │ [▶ Process]      │  │ [▶ Audit]        │                 │
│  │ Est. time: 45m   │  │ Est. time: 50m   │  ← Tier A      │
│  │ Est. cost: $16   │  │ Est. cost: $7    │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                                             │
│  Last run: Never                                            │
│  Model: GPT-4o-mini + Claude Haiku          ← or Tier B    │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Processing View (During Run)

```
┌─────────────────────────────────────────────────────────────┐
│  ⏳ Processing Backlog...                                   │
│                                                             │
│  ████████████░░░░░░░░  7,234 / 18,076  (40%)               │
│                                                             │
│  Layer 1: Processing record 7,235...                        │
│  Layer 2: Reviewing record 7,230...                         │
│  Web Search: 142 queries used               ← Tier B only  │
│                                                             │
│  ETA: 23 minutes remaining                                  │
│  Tokens used: 12.4M input / 6.1M output                    │
│  Cost so far: $8.42                                         │
│                                                             │
│  [⏸ Pause]  [⏹ Cancel]                                     │
└─────────────────────────────────────────────────────────────┘
```

### 10.3 Results Dashboard (After Run)

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Backlog Processing Complete                             │
│  Batch ID: batch_20261028_114500                            │
│  Duration: 42 minutes | Cost: $15.80                        │
│                                                             │
│  ┌─────────────────────────────────────────────────┐        │
│  │ ✅ Auto-linked:      6,234  (34.5%)            │        │
│  │ 🟢 High suggest:     4,102  (22.7%)            │        │
│  │ 🟡 Medium suggest:   2,845  (15.7%)            │        │
│  │ 🔴 AI Conflict:        412  ( 2.3%)            │        │
│  │ 🆕 New Proposed:       287  ( 1.6%)            │        │
│  │ ⬜ Still Unmapped:   4,196  (23.2%)            │        │
│  └─────────────────────────────────────────────────┘        │
│                                                             │
│  [Review Conflicts (412)]  [Review Proposals (287)]         │
│  [Spot-check Auto-links]   [Undo Entire Batch]              │
│  [Export Report]                                            │
└─────────────────────────────────────────────────────────────┘
```

### 10.4 Audit Results Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Linked Record Audit Complete                            │
│  Batch ID: audit_20261028_123000                            │
│  Duration: 52 minutes | Cost: $7.46                         │
│                                                             │
│  ┌─────────────────────────────────────────────────┐        │
│  │ ✅ Confirmed:       28,401  (91.4%)            │        │
│  │ ⚠️ Suspected:        1,842  ( 5.9%)            │        │
│  │ 🚨 Critical:           127  ( 0.4%)            │        │
│  │ ⬜ Inconclusive:       695  ( 2.2%)            │        │
│  └─────────────────────────────────────────────────┘        │
│                                                             │
│  [🚨 Review Critical FIRST (127)]                           │
│  [Review Suspected (1,842)]                                 │
│  [Undo Batch]                                               │
└─────────────────────────────────────────────────────────────┘
```

### 10.5 Conflict Review Detail

```
┌─────────────────────────────────────────────────────────────┐
│  🔴 AI Conflict — Human Review Required                     │
│                                                             │
│  Pharmacy: "Mac Rabonik DSR" | Mfr: ERIS | Pack: 10        │
│                                                             │
│  ┌─ LAYER 1 (GPT-4o) ──────────────────────────────┐       │
│  │ Verdict: MATCH → Rabeprazole+Domperidone Capsule │       │
│  │ Confidence: 91%                                  │       │
│  │ Reasoning: "Rabonik DSR is a well-known brand    │       │
│  │ of Rabeprazole+Domperidone by Eris Lifesciences. │       │
│  │ DSR = Delayed Sustained Release. Form: Capsule." │       │
│  └──────────────────────────────────────────────────┘       │
│                                                             │
│  ┌─ LAYER 2 (Claude Sonnet) ───────────────────────┐       │
│  │ Verdict: DISAGREE with previous link             │       │
│  │ Confidence: 96%                                  │       │
│  │ Reasoning: "Previous link to 'Mac Gel' is wrong. │       │
│  │ Mac Gel is an antacid. Rabonik DSR contains      │       │
│  │ Rabeprazole+Domperidone. Layer 1's match to      │       │
│  │ rabeprazole_domperidone_capsule is CORRECT."     │       │
│  │ Safety flags: FORM_MISMATCH, COMPOSITION_MISMATCH│       │
│  └──────────────────────────────────────────────────┘       │
│                                                             │
│  [✅ Accept Layer 1 Match]  [❌ Reject Both]  [🔍 Manual]   │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Database Changes

### 11.1 New LinkStatus Values

```prisma
enum LinkStatus {
  PENDING        // Existing
  AUTO_LINKED    // Existing
  SUGGESTED      // Existing
  MANUAL_LINKED  // Existing
  UNLINKED       // Existing
  AI_LINKED      // NEW: Both AI layers agreed, ≥95% confidence
  AI_SUGGESTED   // NEW: Both AI layers agreed, 85-94% confidence
  AI_CONFLICT    // NEW: AI layers disagreed, needs human review
  AI_PROPOSED    // NEW: AI proposes new master record
  AI_UNCERTAIN   // NEW: AI couldn't determine, needs human research
  AI_UNMAPPED    // NEW: AI confirmed no match exists
}
```

### 11.2 New Medicine Fields

| Field | Type | Purpose |
|---|---|---|
| `ai_batch_id` | String (nullable) | Links to the processing batch for rollback |
| `ai_layer1_model` | String (nullable) | Which model was used for Layer 1 |
| `ai_layer2_model` | String (nullable) | Which model was used for Layer 2 |
| `ai_layer1_confidence` | Float (nullable) | Layer 1's confidence score |
| `ai_layer2_confidence` | Float (nullable) | Layer 2's confidence score |
| `ai_reasoning` | JSON (nullable) | Both layers' reasoning chains |
| `ai_web_sources` | String[] (nullable) | URLs used for web verification |

### 11.3 New Tables

**AIMatchingBatch**:
| Field | Type | Purpose |
|---|---|---|
| `batch_id` | UUID (PK) | Batch identifier |
| `type` | Enum: BACKLOG, AUDIT, IMPORT | Job type |
| `status` | Enum: RUNNING, COMPLETED, PAUSED, CANCELLED, ROLLED_BACK | Batch status |
| `total_records` | Integer | Records in batch |
| `processed_count` | Integer | Records processed so far |
| `auto_linked_count` | Integer | Result counts |
| `suggested_count` | Integer | |
| `conflict_count` | Integer | |
| `proposed_count` | Integer | |
| `unmapped_count` | Integer | |
| `total_cost_usd` | Float | Actual API cost |
| `total_tokens_input` | BigInt | Token usage |
| `total_tokens_output` | BigInt | |
| `layer1_model` | String | Model used |
| `layer2_model` | String | Model used |
| `started_at` | DateTime | |
| `completed_at` | DateTime (nullable) | |

### 11.4 Propagation Guard

**File**: `backend/src/modules/medicines/linkPropagation.service.js`

**Change**: Add `AI_LINKED` and `AI_SUGGESTED` to the exclusion list in `findCrossShopLink`:

```
Current:  link_status: { in: ["AUTO_LINKED", "MANUAL_LINKED"] }
New:      link_status: { in: ["AUTO_LINKED", "MANUAL_LINKED"] }
          // AI_LINKED explicitly excluded until human confirms
```

---

## 12. Risk Assessment

| Risk | Severity | Likelihood | Tier A | Tier B | Mitigation |
|---|---|---|---|---|---|
| AI auto-links wrong medicine | **Critical** | Low (Tier A) / Very Low (Tier B) | Dual layer + 95% threshold + form hard-block | Same + independent model families + web verification | Audit log + rollback + no propagation |
| AI creates wrong master record | **High** | Medium (Tier A) / Low (Tier B) | Human must approve all proposals | Same + web-verified composition | Never auto-create |
| API rate limit hit | Medium | Low | 10 concurrent, well within limits | Same | Exponential backoff + queue pause |
| API provider downtime | Medium | Low | Queue persists, resume on restart | Same | Multi-provider (OpenAI + Anthropic) |
| Cost overrun | Low | Very Low | $24 total, hard to overrun | $546 total, set spend limits | Dashboard spend caps |
| Hallucinated composition | Medium | Medium (Tier A) / Low (Tier B) | Layer 2 cross-check | Same + web verification | Composition sanity rules |
| Database overload | Low | Low | Trigram queries are indexed | More queries per record | Connection pooling + rate limiting |
| Model deprecation | Low | Medium (1-2 year horizon) | Swap model name in config | Same | Config-driven model selection |

---

## 13. Recommendation

### For a Cost-Sensitive Startup

**Start with Tier A.** Here's the honest reasoning:

1. **$24 vs $546 is not a meaningful difference** for a business decision. Both are trivially cheap. The real cost is the 3-5 weeks of developer time, which is the same either way.

2. **Tier A will resolve 65-75% of the backlog**, which is ~12,000-13,500 records. That alone transforms the admin's workload from months of manual review to days.

3. **The remaining 25-35% that Tier A can't resolve** are the genuinely hard cases — obscure regional brands, ambiguous abbreviations, products not in the 1mg catalog. These are the cases where Tier B's web search and deeper reasoning actually matter.

4. **Upgrading from Tier A to Tier B later is a 2-week incremental effort**, not a rebuild. The architecture is identical — you're swapping model names in `config.js`, adding the Tavily API integration, and enhancing the prompts. All the infrastructure (orchestrator, queue, UI, audit, rollback) stays the same.

### For Maximum Safety from Day One

**Go with Tier B.** If the client's primary concern is patient safety and getting it right the first time:

1. The additional $522 one-time cost buys significantly better accuracy on the hardest cases
2. Web search handles the ~3,000 records that are genuinely unmappable from catalog data alone
3. The two-pass audit catches more incorrect existing links
4. The dual-provider independence (OpenAI + Anthropic) provides the strongest error detection

### The Honest Bottom Line

Both tiers are dramatically better than the current system. The current algorithm gives 92% confidence to "Mac Rabonik DSR → Mac Gel." Even Tier A's GPT-4o-mini would catch that error instantly. The choice between tiers is about the **last 10-15% of hard cases**, not the first 85%.

**My recommendation**: Build Tier A first (3 weeks), process the backlog, review the results. If the remaining unmapped/conflict count is acceptable, stay on Tier A. If not, upgrade to Tier B (2 additional weeks) for the hard cases. Total worst-case: 5 weeks, $570. This de-risks the investment and lets you make the Tier B decision based on real data rather than projections.

---

