/**
 * server/index.js
 * Express backend — Adversarial Contract Analysis Engine
 * v9: Forced exhaustive enumeration — targets 15+ issues
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fetch = require("node-fetch");
const mammoth = require("mammoth");
const path = require("path");
const { classifyContract } = require("./clauseClassifier");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── Rate Limiter ──────────────────────────────────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60000;

function rateLimit(req, res, next) {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_LIMIT_WINDOW) { entry.count = 0; entry.start = now; }
  entry.count++;
  rateLimitMap.set(ip, entry);
  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: "Too many requests. Please wait a minute." });
  }
  next();
}

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildPrompt(contractText, taggedSummary, classifiedSections) {
  // Build a mandatory checklist from the classifier output so the model
  // must address every detected section — not just the obvious ones.
  const mandatoryChecklist = classifiedSections
    .map((c, i) => `  ${i + 1}. [${c.tags.join(",")||"UNCLASSIFIED"}] ${c.name}`)
    .join("\n");

  return `You are an adversarial legal contract auditor. Your job is to find EVERY exploitable weakness in this contract, not just the most obvious ones.

MANDATORY SECTION CHECKLIST — you MUST address every item below:
${mandatoryChecklist}

STEP 1 — EXHAUSTIVE SECTION WALK (do this silently before writing JSON):
Go through every section in the checklist above, one by one. For EACH section ask:
  a) Does one party have unilateral control here?
  b) Is there a payment without a delivery guarantee?
  c) Is there a silence = consent trap?
  d) Who defines "done" or "complete"?
  e) What happens to money if this section is triggered?
  f) Is IP ownership affected?
  g) Is liability waived or capped unfairly?
  h) Can one party change this unilaterally?
  i) Is there a missing standard clause (jurisdiction, notice, force majeure, dispute resolution)?

STEP 2 — PRODUCE ISSUES (minimum 15, no maximum):
You must produce AT LEAST ONE issue for every section that has a [PAYMENT], [TERMINATION], [ACCEPTANCE], [INTELLECTUAL_PROPERTY], [COMPLETION], or [LIABILITY] tag.
Do NOT stop after finding the first few issues. Work through EVERY section.
Sub-clauses within a section each get their own issue if they contain a distinct exploit.

DETECTION RULES — apply all, mark HIGH by default:
1. CONTROL IMBALANCE: "sole discretion", "as determined by", "deemed", "in its reasonable judgement", "at Provider's option"
2. PAYMENT vs DELIVERY: upfront payment not tied to milestones, non-refundable under any circumstances
3. PAYMENT PENALTY TRAPS: interest rates above 1% per month, compounding interest, sub-48h invoice windows
4. SILENCE = CONSENT: any acceptance window under 5 business days, "failure to respond = accepted"
5. COMPLETION CONTROL: one party declares project complete
6. TERMINATION ASYMMETRY: one party exits in <7 days, other needs >30 days OR cure period
7. KEEP-THE-MONEY: any clause where a party retains payment after termination without proportional delivery
8. IP BLOCK: IP transfer gated on vague completion, or triple-gated conditions
9. IP REUSE: provider can reuse custom work for competitors
10. DATA WEAPONIZATION: perpetual data license, AI training rights, retroactive policy changes
11. LIABILITY MISMATCH: cap below 10% of contract value, one-sided indemnity, indemnity covering own negligence
12. AUTO-RENEWAL TRAP: narrow cancellation window, price set by one party at renewal
13. UNILATERAL AMENDMENT: terms changeable by website post or notice with silence = consent
14. RIGGED ARBITRATION: arbitrator/venue/language/rules selected by one party
15. ASYMMETRIC CONFIDENTIALITY: strict obligations on one side, effectively none on the other
16. CRYPTO PAYMENT TRAP: conversion rate controlled by one party
17. MISSING CLAUSES: flag as Medium if contract has no: jurisdiction, force majeure, dispute resolution, warranty, data protection

CROSS-CLAUSE CHAINS — always check these 5 combinations:
- PAYMENT + TERMINATION: money kept after early exit
- PAYMENT + COMPLETION + IP: paid in full but never owns the work
- DELIVERY + ACCEPTANCE + SILENCE: defective work auto-accepted
- TERMINATION + IP: no IP obligation on exit
- AMENDMENT + RENEWAL: terms changed then auto-renewed at new terms

ABUSE SCENARIOS — exactly 4:
Include exactly these types if the contract supports them:
1. PAYMENT_LOSS, 2. ACCEPTANCE_TRAP, 3. OWNERSHIP_BLOCK, 4. TERMINATION_EXPLOIT
Each step MUST name the clause number that permits it.

OUTPUT — return ONLY this JSON, no markdown, no code fences, no text outside the JSON:
{
  "summary": "3 sentences: who is exposed, 3 most dangerous clauses, what to fix first",
  "overall_risk": "Critical",
  "issues": [
    {
      "section": "exact section name from checklist",
      "tags": ["PAYMENT"],
      "risk_level": "High",
      "issue": "one sentence defect — name the mechanism",
      "root_cause": "one sentence — why exploit exists structurally",
      "exploit": "1-2 sentences — exact adversarial sequence, name both parties",
      "fix": "2-3 sentences: mechanism removed + replacement added + trigger condition",
      "revised_clause": "write the ACTUAL contract clause text ready to sign — not a description of what it should say. Use legal language. Include specific numbers, timeframes, and party names. Max 60 words. No vague phrases like 'reasonable' or 'appropriate'."
    }
  ],
  "combined_risks": [
    {
      "clauses_involved": ["Section X", "Section Y"],
      "tags_involved": ["PAYMENT", "TERMINATION"],
      "exploit_chain": [
        "Step 1: Provider does X → Section 3.2 permits because [exact reason]",
        "Step 2: Client has no remedy → Section 6.3 blocks because [exact reason]",
        "Step 3: Outcome — Client loses [specific amount or right]"
      ],
      "what_combination_creates": "one sentence emergent risk not visible in either clause alone",
      "impact": "specific financial or legal consequence with amounts where possible",
      "severity": "Critical"
    }
  ],
  "abuse_simulations": [
    {
      "title": "specific descriptive title",
      "scenario_type": "PAYMENT_LOSS",
      "clauses_exploited": ["Section 3.2", "Section 6.1"],
      "steps": [
        "Step 1: Provider does X → permitted by Section 3.2 because [reason]",
        "Step 2: Client attempts Y → blocked by Section 6.3 because [reason]",
        "Step 3: Outcome — Client loses [specific thing]"
      ],
      "financial_impact": "specific monetary loss with amounts",
      "legal_impact": "specific right extinguished"
    }
  ],
  "top_fixes": [
    {
      "rank": 1,
      "issue": "short label",
      "why_urgent": "specific consequence if unfixed, with amounts",
      "action": "exact change with trigger condition and parties named"
    }
  ]
}

CONTRACT TO AUDIT:
---
${contractText}
---`;
}

// ── Call AI API ───────────────────────────────────────────────────────────────
async function callAI(prompt) {
  if (process.env.ANTHROPIC_API_KEY) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 12000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic error: ${err}`);
    }

    const data = await response.json();
    const raw = data.content[0].text;
    return safeParseJSON(raw);

  } else if (process.env.OPENAI_API_KEY) {
    const baseUrl = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
    const model = process.env.OPENAI_MODEL || "gpt-4o";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000); // 55s timeout

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        // Groq llama-3.3-70b supports up to 32768 context but
        // free tier caps tokens/min — 6000 output is safe.
        max_tokens: 6000,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content:
              "You are an adversarial legal contract auditor. " +
              "Respond ONLY with a valid JSON object. " +
              "No markdown, no code fences, no text before or after the JSON. " +
              "You MUST produce at least 15 issues. " +
              "Do not stop early. Walk every section before writing output.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      clearTimeout(timeout);
      const err = await response.text();
      throw new Error(`API error: ${err}`);
    }

    const data = await response.json();
    clearTimeout(timeout);
    const raw = data.choices[0].message.content;
    return safeParseJSON(raw);

  } else {
    throw new Error("No API key set. Add ANTHROPIC_API_KEY or OPENAI_API_KEY to your .env file.");
  }
}

// ── Safe JSON parser — handles fenced responses ───────────────────────────────
function safeParseJSON(raw) {
  // Strip markdown code fences if the model added them despite instructions
  let cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    // Last resort: extract first balanced { ... } block
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first !== -1 && last > first) {
      try {
        return JSON.parse(cleaned.slice(first, last + 1));
      } catch (e2) {
        throw new Error("AI returned malformed JSON. Try a shorter contract or try again.");
      }
    }
    throw new Error("AI returned malformed JSON. Try a shorter contract or try again.");
  }
}

// ── Validate + normalize response ─────────────────────────────────────────────
function validateResult(result) {
  if (!result || typeof result !== "object") throw new Error("AI returned non-object response");
  if (!Array.isArray(result.issues)) throw new Error("Missing issues array");
  if (!Array.isArray(result.combined_risks)) result.combined_risks = [];
  if (!Array.isArray(result.abuse_simulations)) result.abuse_simulations = [];
  if (!Array.isArray(result.top_fixes)) result.top_fixes = [];
  if (!result.summary) result.summary = "Analysis complete.";
  if (!result.overall_risk) result.overall_risk = "High";

  // Normalize risk levels (handle uppercase from some models)
  result.issues = result.issues.map(issue => ({
    ...issue,
    risk_level: normalizeRiskLevel(issue.risk_level),
  }));

  // Deduplicate issues by section name to prevent the duplicate-rendering bug
  const seen = new Set();
  result.issues = result.issues.filter(issue => {
    const key = (issue.section || "").toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Deduplicate combined_risks by clause combination
  const seenChains = new Set();
  result.combined_risks = result.combined_risks.filter(cr => {
    const key = (cr.clauses_involved || []).sort().join("|").toLowerCase();
    if (seenChains.has(key)) return false;
    seenChains.add(key);
    return true;
  });

  // Deduplicate abuse_simulations by scenario_type
  const seenSims = new Set();
  result.abuse_simulations = result.abuse_simulations.filter(sim => {
    const key = (sim.scenario_type || sim.title || "").toLowerCase();
    if (seenSims.has(key)) return false;
    seenSims.add(key);
    return true;
  });

  // Cap top_fixes at 5
  result.top_fixes = result.top_fixes.slice(0, 5);

  const issueCount = result.issues.length;
  console.log(`✅ Issues after dedup: ${issueCount}`);
  if (issueCount < 15) {
    console.warn(`⚠ Only ${issueCount} issues found — target is 15+`);
  }

  return result;
}

function normalizeRiskLevel(raw) {
  if (!raw) return "Medium";
  const s = String(raw).trim();
  const cap = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  if (["Critical", "High", "Medium", "Low"].includes(cap)) return cap;
  // Handle "HIGH", "CRITICAL" etc.
  const upper = s.toUpperCase();
  if (upper === "CRITICAL") return "Critical";
  if (upper === "HIGH") return "High";
  if (upper === "MEDIUM") return "Medium";
  if (upper === "LOW") return "Low";
  return "Medium";
}

// ── Route: Analyze ────────────────────────────────────────────────────────────
app.post("/api/analyze", rateLimit, async (req, res) => {
  const { contractText } = req.body;

  if (!contractText || contractText.trim().length < 50) {
    return res.status(400).json({ error: "Please provide a complete contract (at least 50 characters)." });
  }
  if (contractText.length > 100000) {
    return res.status(400).json({ error: "Contract too large. Maximum 100,000 characters." });
  }

  try {
    // Step 1: Pre-classify clauses
    const { clauses, stats, taggedSummary } = classifyContract(contractText);

    console.log(`\n📋 Clause pre-classification:`);
    console.log(`   Total:        ${stats.total}`);
    console.log(`   Classified:   ${stats.classified}`);
    console.log(`   Tag breakdown: ${JSON.stringify(stats.tagCounts)}`);

    // Step 2: Build prompt with mandatory checklist
    const prompt = buildPrompt(contractText, taggedSummary, clauses);

    // Step 3: AI analysis
    const result = await callAI(prompt);

    // Step 4: Attach classification metadata
    result._classification = {
      clauses: clauses.map(c => ({
        name: c.name,
        tags: c.tags,
        confidence: c.confidence,
        classified: c.classified
      })),
      stats
    };

    res.json(validateResult(result));

  } catch (err) {
    console.error("Analysis error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Route: Extract text from file ─────────────────────────────────────────────
app.post("/api/extract", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  const ext = path.extname(req.file.originalname).toLowerCase();

  try {
    let text = "";
    if (ext === ".txt") {
      text = req.file.buffer.toString("utf-8");
    } else if (ext === ".pdf") {
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } else if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else {
      return res.status(400).json({ error: `Unsupported file type: ${ext}. Use PDF, DOCX, or TXT.` });
    }

    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: "Could not extract readable text. Is this a scanned image PDF?" });
    }

    res.json({ text: text.trim(), filename: req.file.originalname });
  } catch (err) {
    console.error("Extraction error:", err.message);
    res.status(500).json({ error: `Failed to extract text: ${err.message}` });
  }
});

// ── Serve React build in production ──────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build/index.html"));
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ Server running at http://localhost:${PORT}`);
  console.log(`   Mode: Adversarial Analysis Engine v9 — Exhaustive Enumeration`);
  console.log(`   AI:   ${process.env.ANTHROPIC_API_KEY ? "Anthropic Claude ✓" : process.env.OPENAI_API_KEY ? `OpenAI-compatible (${process.env.OPENAI_API_BASE || "openai.com"}) ✓` : "⚠ NO API KEY SET"}\n`);
});
