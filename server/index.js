/**
 * server/index.js
 * Express backend — Adversarial Contract Analysis Engine
 * v6: Enforced complete scenario coverage (min 3, typed, clause-linked)
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fetch = require("node-fetch");
const mammoth = require("mammoth");
const path = require("path");

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

// ── Prompt v6 ─────────────────────────────────────────────────────────────────
function buildPrompt(contractText) {
  return `You are an adversarial legal analyst, contract security auditor, and cross-clause intelligence engine.

You operate in FOUR phases. Complete each phase fully and in order.

═══════════════════════════════════════════════════
PHASE 1 — CLAUSE-LEVEL ANALYSIS
═══════════════════════════════════════════════════

Read every clause. For each clause:

STEP 1 — TAG with every applicable category:
  PAYMENT | DELIVERY | ACCEPTANCE | TERMINATION | COMPLETION | INTELLECTUAL_PROPERTY | LIABILITY | REVISION | CONFIDENTIALITY | DISPUTE

STEP 2 — IDENTIFY structural defect:
  - Ambiguity: undefined terms, subjective standards
  - Unilateral control: one party decides outcome, criteria, or timing
  - Missing dependency: obligation not gated on required condition
  - Asymmetric obligation: one party bears all risk
  - Silence mechanism: inaction treated as consent

STEP 3 — INTERNAL FIX VALIDATION before writing any fix:
  Q1. Root cause: WHY does the exploit exist?
  Q2. After fix applied: can the same exploit still execute? If YES → redesign.
  Q3. Does the revised clause contain: "reasonable", "sole discretion", "deemed",
      "as needed", "timely", "appropriate", "substantial", "core features"?
      If YES → replace with objective, bilateral, measurable language.

FIX STRENGTH RULES:
  ACCEPTANCE:  Remove silence-based acceptance. Require explicit written approval with objective checklist. Non-response triggers dispute — not acceptance.
  PAYMENT:     Gate every payment behind named milestone with objective criteria. Payment only after written milestone acceptance. Define refund formula.
  TERMINATION: Exact refund formula. Delivery of completed work before settlement. Notice in calendar days. IP disposition on termination.
  COMPLETION:  Mutual written sign-off. Objective criteria defined by BOTH parties before work starts. Non-response triggers dispute — not acceptance.
  LIABILITY:   Bilateral cap. Excluded damage categories listed. Carve-outs for fraud and gross negligence.
  IP:          Transfer on BOTH full payment AND written delivery. Interim license during development. Termination IP disposition defined.

═══════════════════════════════════════════════════
PHASE 2 — OWNERSHIP BLOCK & COMPLETION CONTROL ANALYSIS
(Mandatory dedicated pass — run independently after Phase 1)
═══════════════════════════════════════════════════

STEP A — IP TRANSFER SCAN
  Find every clause that transfers ownership. For each:
  - What exact condition triggers transfer?
  - Who controls or defines that condition?
  - Is the condition objective and bilateral?

STEP B — COMPLETION CONTROL DETECTION
  FLAG CRITICAL if ANY:
  - One party alone determines completion
  - Completion uses vague terms ("substantially complete", "core features", "working version")
  - Client silence = completion/acceptance
  - Revision exhaustion triggers deemed completion
  - Approval required but criteria undefined

STEP C — PAYMENT-COMPLETION-IP DEPENDENCY CHAIN
  If ALL THREE exist simultaneously:
    1. Payment required before or during work
    2. IP transfer depends on "completion" or "approval"
    3. Completion or approval controlled/defined by one party OR vague
  → OWNERSHIP BLOCK → mark CRITICAL
  → Add to issues array with tags: ["INTELLECTUAL_PROPERTY", "COMPLETION", "PAYMENT"]
  → Fix must: transfer IP upon full payment + written delivery, not upon subjective completion

STEP D — TERMINATION IP GAP
  If contract terminates mid-project with no clause covering IP disposition:
  → Add CRITICAL issue: client paid for work but cannot legally own or use it post-termination

═══════════════════════════════════════════════════
PHASE 3 — CROSS-CLAUSE INTELLIGENCE ENGINE
(Run after Phases 1 and 2. Reveal only what combinations create — not individual issues.)
═══════════════════════════════════════════════════

MANDATORY RELATIONSHIP CHECKS:

A. PAYMENT + ACCEPTANCE
   CRITICAL if non-refundable. Risk: payment before valid acceptance mechanism.

B. PAYMENT + TERMINATION
   CRITICAL if upfront > 30%. Risk: money retained without delivery on exit.

C. PAYMENT + COMPLETION + IP
   CRITICAL always. Use Phase 2 finding — do not duplicate, reference it.

D. DELIVERY + ACCEPTANCE + SILENCE
   CRITICAL if window < 5 days or undefined. Risk: defective work legally accepted through inaction.

E. PARTIAL DELIVERY + ACCEPTANCE + PAYMENT
   Always HIGH. Risk: minimal output triggers full payment.

F. REVISION + COMPLETION + ACCEPTANCE
   HIGH if revision limits exist without quality criteria. Risk: exhaustion triggers deemed completion.

G. TERMINATION + IP + PAYMENT
   CRITICAL if no termination IP clause. Risk: paid-for work not transferable on exit.

H. LIABILITY + INDEMNITY + PAYMENT
   HIGH if cap absent or one-sided. Risk: unlimited asymmetric exposure.

Also run OPEN-ENDED CHAIN DETECTION for any additional 2-3 clause combinations creating non-obvious High or Critical exploit paths not listed above.

Each combined risk entry must include:
- exploit_chain: 3-5 numbered steps naming the specific clause that permits each step
- what_combination_creates: one sentence — the emergent risk neither clause creates alone
- impact: concrete financial or legal consequence

═══════════════════════════════════════════════════
PHASE 4 — ABUSE SCENARIO ENFORCEMENT
(Mandatory final pass. This phase runs AFTER Phases 1-3 and uses their findings as inputs.)
═══════════════════════════════════════════════════

RULE 1 — MINIMUM COUNT
  You MUST generate at least 3 abuse_simulations. If fewer than 3 risks exist, generate 3 anyway using the most significant risks found.

RULE 2 — SCENARIO TYPE CHECKLIST
  Check each of the following 4 scenario types. If the risk is present in the contract, that scenario is MANDATORY:

  TYPE 1 — PAYMENT LOSS
    Trigger condition: payment is upfront, non-refundable, or not milestone-linked
    Title format: "Payment Trap — [specific mechanism from this contract]"
    Scenario: Client pays → work not delivered or incomplete → no refund mechanism → client loses payment
    Must show: which clause requires payment, which clause fails to protect against non-delivery

  TYPE 2 — ACCEPTANCE TRAP
    Trigger condition: silence = acceptance OR vague acceptance criteria OR partial delivery counts
    Title format: "Forced Acceptance — [specific mechanism from this contract]"
    Scenario: Substandard work delivered → client misses narrow/vague objection window → work legally accepted → payment due in full
    Must show: what the silence window is, what "accepted" work triggers (payment, IP transfer, etc.)

  TYPE 3 — OWNERSHIP BLOCK
    Trigger condition: IP transfer depends on vague or unilaterally controlled completion
    Title format: "Paid in Full, Owns Nothing — [specific mechanism from this contract]"
    Scenario: Full payment made → developer withholds completion declaration → IP never transfers → client cannot use product
    Must show: what completion condition blocks transfer, what developer gains by withholding

  TYPE 4 — TERMINATION EXPLOIT
    Trigger condition: termination clause allows one party to exit while retaining payment without delivery
    Title format: "Exit and Keep — [specific mechanism from this contract]"
    Scenario: Developer receives payment → triggers termination → no refund formula → no delivery obligation → client left with nothing
    Must show: which termination clause is used, what is and is not returned

RULE 3 — SCENARIO FORMAT (mandatory for every scenario)
  {
    "title": "Specific, concrete title — not generic",
    "scenario_type": "PAYMENT_LOSS | ACCEPTANCE_TRAP | OWNERSHIP_BLOCK | TERMINATION_EXPLOIT | OTHER",
    "clauses_exploited": ["Section X", "Section Y"],
    "steps": [
      "Step 1: [Exploiting party] takes [specific action] → permitted by [Section X] because [exact reason]",
      "Step 2: [Condition] is now active → [Section Y] states [exact effect]",
      "Step 3: [Victim party] attempts [remedy] → blocked because [specific clause or absence of clause]",
      "Step 4: Outcome — [victim] loses [specific thing: money amount, IP, right, remedy]"
    ],
    "financial_impact": "Concrete consequence — name the money lost, the right extinguished, or the obligation created. Not vague.",
    "legal_impact": "What the victim cannot do legally as a result — cannot sue, cannot use product, cannot recover payment, etc."
  }

RULE 4 — QUALITY ENFORCEMENT
  A scenario FAILS if:
  - Steps are vague (e.g., "Client may lose money")
  - Steps do not name the clause that permits each action
  - financial_impact is not concrete (must name dollar exposure or specific asset lost)
  - legal_impact is missing
  - The scenario is a restatement of another scenario with different words
  - The exploiting party's gain is not identified

RULE 5 — SCENARIO ORDERING
  Order scenarios by severity: most financially damaging first.
  If OWNERSHIP BLOCK and PAYMENT LOSS both exist, OWNERSHIP BLOCK goes first.

═══════════════════════════════════════════════════
CRITICAL PATTERN DETECTION (always check all 6):

1. PAYMENT RISK: upfront >50% OR non-refundable OR not milestone-linked → HIGH
2. ACCEPTANCE TRAP: silence=acceptance OR window <5 days OR partial=full → HIGH
3. COMPLETION CONTROL: one party defines done OR vague criteria → HIGH
4. TERMINATION IMBALANCE: money kept without delivery on exit → HIGH
5. IP RISK: ownership blocked by vague or unilateral trigger → HIGH (CRITICAL if payment already made)
6. LIABILITY MISMATCH: uncapped OR applies to one side only → HIGH

═══════════════════════════════════════════════════
OUTPUT — Return ONLY this JSON object. No markdown. No code fences. No text outside JSON.

{
  "summary": "2-3 sentences: which party is most exposed, dominant exploit category, single most urgent fix",
  "overall_risk": "Low|Medium|High|Critical",

  "issues": [
    {
      "section": "Clause name or number",
      "tags": ["PAYMENT", "ACCEPTANCE"],
      "risk_level": "Low|Medium|High",
      "issue": "One sentence: the structural defect",
      "root_cause": "One sentence: WHY the exploit exists",
      "exploit": "1-2 sentences: exact adversarial action sequence",
      "fix": "2-3 sentences: mechanism removed, replacement added, exploit path confirmed closed",
      "revised_clause": "Full rewritten clause. Bilateral, objective, no ambiguous terms. Max 80 words."
    }
  ],

  "combined_risks": [
    {
      "clauses_involved": ["Section X", "Section Y", "Section Z"],
      "tags_involved": ["PAYMENT", "ACCEPTANCE", "TERMINATION"],
      "exploit_chain": [
        "Step 1: Party A does X → Section 3 permits this because...",
        "Step 2: Condition Y triggered → Section 5 requires...",
        "Step 3: Party B has no remedy because...",
        "Step 4: Outcome — Party B loses [specific thing]"
      ],
      "what_combination_creates": "One sentence: emergent risk neither clause creates alone",
      "impact": "Concrete financial or legal consequence",
      "severity": "High|Critical"
    }
  ],

  "abuse_simulations": [
    {
      "title": "Specific, concrete title",
      "scenario_type": "PAYMENT_LOSS|ACCEPTANCE_TRAP|OWNERSHIP_BLOCK|TERMINATION_EXPLOIT|OTHER",
      "clauses_exploited": ["Section X", "Section Y"],
      "steps": [
        "Step 1: [Exploiting party] takes [action] → permitted by [Section X] because [reason]",
        "Step 2: [Effect] → [Section Y] states [consequence]",
        "Step 3: [Victim] attempts [remedy] → blocked because [clause or absence]",
        "Step 4: Outcome — [victim] loses [specific asset or right]"
      ],
      "financial_impact": "Concrete — name the money lost or asset at risk",
      "legal_impact": "What victim legally cannot do as a result"
    }
  ],

  "top_fixes": [
    {
      "rank": 1,
      "issue": "Short label",
      "why_urgent": "Specific financial or legal consequence if unfixed",
      "action": "Exact change: what to remove, what to add, what to define"
    }
  ]
}

═══════════════════════════════════════════════════
HARD FAILURE CONDITIONS — output is rejected if:
- fewer than 3 abuse_simulations generated
- any scenario missing clauses_exploited, scenario_type, or legal_impact
- any scenario step does not name the clause permitting the action
- financial_impact is vague (e.g., "client may lose money")
- two scenarios describe the same exploit with different wording
- IP clause analyzed without checking who controls transfer trigger
- ownership block present but not marked CRITICAL
- combined_risks empty
- any combined risk restates a clause issue without showing interaction effect
- any revised clause contains: "reasonable", "sole discretion", "deemed", "as needed",
  "timely", "appropriate", "substantial completion", "core features"
- fix only extends a time window without changing the underlying mechanism
- CRITICAL not assigned when full payment possible + ownership blockable

CONTRACT TO ANALYZE:
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
            content: "You are an adversarial legal contract analyst and cross-clause intelligence engine. Respond ONLY with a valid JSON object. No markdown, no code fences, no text before or after the JSON.",
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

// ── Validate + enforce minimum scenario count ─────────────────────────────────
function validateResult(result) {
  if (!result || typeof result !== "object") throw new Error("AI returned non-object response");
  if (!Array.isArray(result.issues)) throw new Error("Missing issues array");
  if (!Array.isArray(result.combined_risks)) result.combined_risks = [];
  if (!Array.isArray(result.abuse_simulations)) result.abuse_simulations = [];
  if (!Array.isArray(result.top_fixes)) result.top_fixes = [];
  if (!result.summary) result.summary = "Analysis complete.";
  if (!result.overall_risk) result.overall_risk = "Medium";

  // Server-side guard: warn if AI returned fewer than 3 scenarios
  if (result.abuse_simulations.length < 3) {
    console.warn(`⚠ Warning: AI returned only ${result.abuse_simulations.length} scenario(s). Prompt enforcement may have failed.`);
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
    const result = await callAI(buildPrompt(contractText));
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
  console.log(`   Mode: Adversarial Contract Analysis Engine v6`);
  console.log(`   AI:   ${process.env.ANTHROPIC_API_KEY ? "Anthropic Claude ✓" : process.env.OPENAI_API_KEY ? `OpenAI-compatible (${process.env.OPENAI_API_BASE || "openai.com"}) ✓` : "⚠ NO API KEY SET"}\n`);
});