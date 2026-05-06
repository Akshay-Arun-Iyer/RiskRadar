/**
 * server/index.js
 * Express backend — Adversarial Contract Analysis Engine
 * v8: Atticus-inspired hybrid clause pre-classification
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

// ── Prompt builder (now receives pre-classified clause map) ───────────────────
function buildPrompt(contractText, taggedSummary) {
  return `You are an adversarial legal contract analyst. Analyze the contract below and return ONLY valid JSON — no markdown, no code fences.

CLAUSE PRE-CLASSIFICATION (provided by Atticus-inspired classifier — use these tags, do not re-detect clause types from scratch):
The following clauses have already been identified and tagged. Use these tags when referencing sections in your output.
${taggedSummary}

RULES:
- Use "Client" and "Developer" consistently (capital letters, no synonyms)
- Every issue needs all fields: section, tags, risk_level, issue, root_cause, exploit, fix, revised_clause
- Use the pre-classified tags above for the "tags" field in each issue — only override if a clause is clearly mis-tagged
- revised_clause max 60 words, must name both parties, no vague terms ("reasonable", "deemed", "sole discretion", "as needed", "timely", "substantial completion")
- Every payment fix must include: (1) milestone-based payments, (2) Client written approval before payment releases, (3) refund formula if milestone not delivered
- Every fix must name the mechanism removed, the replacement added, and the trigger condition

CRITICAL PATTERNS TO ALWAYS CHECK:
1. PAYMENT RISK: upfront payment not tied to milestones, or non-refundable → HIGH
2. ACCEPTANCE TRAP: silence = acceptance, or vague/short objection window → HIGH
3. COMPLETION CONTROL: one party defines "done" unilaterally → HIGH
4. TERMINATION IMBALANCE: party exits keeping money without delivering work → HIGH
5. IP BLOCK: IP transfer depends on vague or one-party-controlled completion → CRITICAL
6. LIABILITY MISMATCH: uncapped or one-sided liability → HIGH

OWNERSHIP BLOCK (always check):
If Client pays + IP transfer depends on completion + completion is vague or Developer-controlled
→ Mark CRITICAL. Fix: IP transfers upon full payment + Developer written delivery notice only.

CROSS-CLAUSE CHAINS (combined_risks):
Check these combinations and include if found:
- PAYMENT + TERMINATION: money kept without delivery → CRITICAL if upfront > 30%
- PAYMENT + COMPLETION + IP: paid but ownership blocked → CRITICAL always
- DELIVERY + ACCEPTANCE + SILENCE: defective work auto-accepted → CRITICAL if window undefined
- TERMINATION + IP: no IP clause on exit → CRITICAL

ABUSE SCENARIOS (minimum 3, mandatory):
Include whichever apply:
- PAYMENT_LOSS: Client pays → no delivery → no refund
- ACCEPTANCE_TRAP: bad work delivered → silence window → legally accepted → payment due
- OWNERSHIP_BLOCK: Client pays in full → Developer blocks completion → IP never transfers
- TERMINATION_EXPLOIT: Developer gets paid → terminates → keeps money → delivers nothing

Each scenario step must name the clause that permits it.

OUTPUT JSON:
{
  "summary": "2-3 sentences on risk, exposed party, most urgent fix",
  "overall_risk": "Low|Medium|High|Critical",
  "issues": [
    {
      "section": "clause name from the pre-classification above",
      "tags": ["PAYMENT"],
      "risk_level": "High",
      "issue": "one sentence defect",
      "root_cause": "one sentence why exploit exists",
      "exploit": "1-2 sentences exact adversarial sequence",
      "fix": "2-3 sentences: what removed, what added, trigger condition, exploit closed",
      "revised_clause": "rewritten clause, max 60 words, bilateral, objective"
    }
  ],
  "combined_risks": [
    {
      "clauses_involved": ["Section X", "Section Y"],
      "tags_involved": ["PAYMENT", "TERMINATION"],
      "exploit_chain": [
        "Step 1: Developer does X → Section 3 permits because [reason]",
        "Step 2: Client has no remedy → Section 5 blocks because [reason]",
        "Step 3: Outcome — Client loses [specific thing]"
      ],
      "what_combination_creates": "one sentence emergent risk",
      "impact": "specific financial or legal consequence",
      "severity": "High|Critical"
    }
  ],
  "abuse_simulations": [
    {
      "title": "specific title",
      "scenario_type": "PAYMENT_LOSS|ACCEPTANCE_TRAP|OWNERSHIP_BLOCK|TERMINATION_EXPLOIT|OTHER",
      "clauses_exploited": ["Section X"],
      "steps": [
        "Step 1: Developer does X → permitted by Section 2 because [reason]",
        "Step 2: Client attempts remedy → blocked because [clause or absence]",
        "Step 3: Outcome — Client loses [specific asset or right]"
      ],
      "financial_impact": "specific monetary loss",
      "legal_impact": "specific right extinguished"
    }
  ],
  "top_fixes": [
    {
      "rank": 1,
      "issue": "short label",
      "why_urgent": "specific consequence if unfixed",
      "action": "exact change with trigger condition"
    }
  ]
}

CONTRACT:
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
        max_tokens: 8000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic error: ${err}`);
    }

    const data = await response.json();
    const raw = data.content[0].text;
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    return JSON.parse(cleaned);

  } else if (process.env.OPENAI_API_KEY) {
    const baseUrl = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
    const model = process.env.OPENAI_MODEL || "gpt-4o";

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 8000,
        messages: [
          {
            role: "system",
            content: "You are an adversarial legal contract analyst. Respond ONLY with a valid JSON object. No markdown, no code fences, no text before or after the JSON.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API error: ${err}`);
    }

    const data = await response.json();
    const raw = data.choices[0].message.content;
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    return JSON.parse(cleaned);

  } else {
    throw new Error("No API key set. Add ANTHROPIC_API_KEY or OPENAI_API_KEY to your .env file.");
  }
}

// ── Validate response ─────────────────────────────────────────────────────────
function validateResult(result) {
  if (!result || typeof result !== "object") throw new Error("AI returned non-object response");
  if (!Array.isArray(result.issues)) throw new Error("Missing issues array");
  if (!Array.isArray(result.combined_risks)) result.combined_risks = [];
  if (!Array.isArray(result.abuse_simulations)) result.abuse_simulations = [];
  if (!Array.isArray(result.top_fixes)) result.top_fixes = [];
  if (!result.summary) result.summary = "Analysis complete.";
  if (!result.overall_risk) result.overall_risk = "Medium";

  if (result.abuse_simulations.length < 3) {
    console.warn(`⚠ Only ${result.abuse_simulations.length} scenario(s) — minimum is 3`);
  }

  return result;
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
    // ── Step 1: Pre-classify clauses using Atticus-inspired classifier ──────
    const { clauses, stats, taggedSummary } = classifyContract(contractText);

    console.log(`\n📋 Clause pre-classification complete:`);
    console.log(`   Total clauses: ${stats.total}`);
    console.log(`   Classified:    ${stats.classified}`);
    console.log(`   Unclassified:  ${stats.unclassified}`);
    console.log(`   Tag breakdown: ${JSON.stringify(stats.tagCounts)}`);

    // ── Step 2: Build prompt with pre-tagged clause map ────────────────────
    const prompt = buildPrompt(contractText, taggedSummary);

    // ── Step 3: Run adversarial AI analysis ────────────────────────────────
    const result = await callAI(prompt);

    // ── Step 4: Attach pre-classification data to response ─────────────────
    // The frontend receives both the AI analysis AND the raw clause map
    // so it can display confidence scores and classifier metadata
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
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: "AI returned malformed JSON. Try a shorter contract or try again." });
    }
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
  console.log(`   Mode: Adversarial Analysis Engine v8 + Atticus Classifier`);
  console.log(`   AI:   ${process.env.ANTHROPIC_API_KEY ? "Anthropic Claude ✓" : process.env.OPENAI_API_KEY ? `OpenAI-compatible (${process.env.OPENAI_API_BASE || "openai.com"}) ✓` : "⚠ NO API KEY SET"}\n`);
});