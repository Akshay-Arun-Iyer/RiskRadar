/**
 * clauseClassifier.js
 * Hybrid clause pre-classifier using Atticus-inspired category definitions.
 *
 * Splits a contract into clauses, tags each with standardized categories,
 * and attaches confidence scores. High-confidence tags are passed to the
 * AI prompt to improve classification accuracy without redundant re-detection.
 *
 * Based on Atticus Open Contract Dataset category definitions:
 * https://www.atticusprojectai.org/cuad
 *
 * IMPORTANT: This module handles ONLY clause identification and tagging.
 * Risk scoring, exploit detection, and fix generation remain entirely
 * in the AI prompt (server/index.js). These concerns are strictly separated.
 */

// ── Atticus-inspired category definitions ────────────────────────────────────
// Each category maps to the Atticus dataset clause types with keyword signals.
// Keywords are drawn from actual Atticus annotation guidelines.

const CATEGORY_RULES = [
  {
    tag: "PAYMENT",
    // Atticus: "Covenant" + "Financial terms" categories
    keywords: [
      "payment", "pay ", "pays ", "paid", "fee", "fees", "invoice",
      "invoiced", "invoicing", "compensation", "remuneration", "salary",
      "wage", "price", "pricing", "cost", "costs", "charge", "charges",
      "billing", "bill ", "subscription", "retainer", "deposit",
      "milestone payment", "advance", "upfront", "non-refundable",
      "refund", "reimbursement", "expense", "expenses", "due date",
      "payment terms", "payment schedule", "overdue", "late payment",
      "interest on late", "net 30", "net 60", "net 90"
    ],
    weight: 1.0
  },
  {
    tag: "ACCEPTANCE",
    // Atticus: "Acceptance" and "Deemed acceptance" categories
    keywords: [
      "acceptance", "accept", "accepted", "accepting", "deemed accepted",
      "deemed complete", "deemed approved", "approval", "approve",
      "approved", "approving", "sign-off", "sign off", "sign off on",
      "written approval", "written acceptance", "explicit approval",
      "formal acceptance", "review period", "review window",
      "objection period", "objection window", "no objection",
      "failure to respond", "failure to object", "silence",
      "without response", "without objection", "deemed satisfactory"
    ],
    weight: 1.0
  },
  {
    tag: "TERMINATION",
    // Atticus: "Termination for convenience" + "Termination for cause"
    keywords: [
      "terminat", "termination", "terminate", "terminated", "terminating",
      "cancellation", "cancel", "cancelled", "cancelling", "end this agreement",
      "end the agreement", "expiration", "expire", "expiry", "wind down",
      "notice of termination", "right to terminate", "either party may terminate",
      "upon termination", "following termination", "in the event of termination",
      "without cause", "for cause", "for convenience", "material breach",
      "cure period", "notice period", "30 days notice", "60 days notice"
    ],
    weight: 1.0
  },
  {
    tag: "INTELLECTUAL_PROPERTY",
    // Atticus: "IP ownership", "License grant", "IP assignment" categories
    keywords: [
      "intellectual property", "ip ", "i.p.", "ownership", "owns",
      "copyright", "copyrights", "patent", "patents", "trademark",
      "trademarks", "trade secret", "trade secrets", "proprietary",
      "license", "licence", "licensed", "licensing", "sublicense",
      "assignment", "assign", "assigns", "assigned", "transfer of ownership",
      "transfers to", "vests in", "work product", "work-product",
      "deliverable ownership", "moral rights", "waive moral",
      "all rights reserved", "rights in", "rights to", "grant of rights",
      "exclusive rights", "non-exclusive", "perpetual license"
    ],
    weight: 1.0
  },
  {
    tag: "COMPLETION",
    // Atticus: "Delivery" + "Milestone" + "Completion" categories
    keywords: [
      "completion", "complete", "completed", "completing", "final delivery",
      "project completion", "upon completion", "after completion",
      "substantial completion", "substantially complete", "done",
      "finished", "finalized", "final version", "final deliverable",
      "milestone", "milestones", "phase completion", "sprint completion",
      "sign-off on completion", "completion criteria", "completion date",
      "completion confirmation", "deemed complete", "marks completion"
    ],
    weight: 1.0
  },
  {
    tag: "DELIVERY",
    // Atticus: "Delivery" category
    keywords: [
      "deliver", "delivery", "delivered", "delivering", "deliverable",
      "deliverables", "handover", "hand over", "hand-off", "handoff",
      "submission", "submit", "submitted", "submitting", "provide",
      "provision of", "supply", "supplied", "supplying", "deploy",
      "deployment", "release", "releases", "ship", "shipped", "shipping",
      "due date", "delivery date", "delivery schedule", "on time delivery",
      "timely delivery", "delivery of work", "delivery of services"
    ],
    weight: 1.0
  },
  {
    tag: "LIABILITY",
    // Atticus: "Limitation of liability" + "Indemnification" categories
    keywords: [
      "liability", "liable", "indemnif", "indemnity", "indemnification",
      "indemnify", "indemnified", "hold harmless", "defend", "defense",
      "damages", "damage", "consequential", "indirect damage", "direct damage",
      "limitation of liability", "limit of liability", "liability cap",
      "maximum liability", "aggregate liability", "no liability",
      "not liable", "shall not be liable", "exclude liability",
      "exclusion of liability", "warranty", "warranties", "disclaim",
      "disclaimer", "as is", "without warranty", "fitness for purpose",
      "negligence", "gross negligence", "willful misconduct", "tort"
    ],
    weight: 1.0
  },
  {
    tag: "REVISION",
    // Atticus: "Amendment" + "Change order" categories
    keywords: [
      "revision", "revisions", "revise", "revised", "revising",
      "amendment", "amend", "amended", "amending", "change order",
      "change request", "scope change", "modification", "modify",
      "modified", "modifying", "alteration", "alter", "altered",
      "feedback", "round of revision", "revision limit", "revision cycle",
      "number of revisions", "additional revision", "revision request",
      "rework", "redo", "iteration", "iterations", "review cycle"
    ],
    weight: 1.0
  },
  {
    tag: "CONFIDENTIALITY",
    // Atticus: "Non-disclosure" + "Confidentiality" categories
    keywords: [
      "confidential", "confidentiality", "non-disclosure", "nda",
      "trade secret", "proprietary information", "sensitive information",
      "disclose", "disclosure", "disclosed", "not disclose", "keep confidential",
      "maintain confidentiality", "confidential information",
      "protected information", "secret", "secrets", "privacy",
      "data protection", "third party disclosure", "permitted disclosure"
    ],
    weight: 1.0
  },
  {
    tag: "DISPUTE",
    // Atticus: "Dispute resolution" + "Governing law" + "Arbitration" categories
    keywords: [
      "dispute", "disputes", "dispute resolution", "arbitration",
      "arbitrate", "arbitrator", "mediation", "mediate", "mediator",
      "governing law", "jurisdiction", "governed by", "applicable law",
      "venue", "forum", "litigation", "lawsuit", "legal proceedings",
      "court", "courts", "tribunal", "adr", "alternative dispute",
      "binding arbitration", "class action", "class action waiver",
      "choice of law", "choice of forum", "escalation process"
    ],
    weight: 1.0
  }
];

// ── Clause splitter ───────────────────────────────────────────────────────────
/**
 * Splits a contract into meaningful clauses.
 * Strategy (in order of preference):
 * 1. Numbered sections (1., 2., 1.1, Article I, Section 1)
 * 2. ALL CAPS headings
 * 3. Double newline paragraph breaks
 * Falls back to paragraph-level splitting for unstructured contracts.
 */
function splitIntoClauses(contractText) {
  const text = contractText.trim();

  // Try numbered section pattern first (most reliable for formal contracts)
  const numberedPattern = /(?=(?:\n|^)\s*(?:\d+\.|\d+\.\d+|[A-Z]{1,3}\.|Article\s+\d+|Section\s+\d+|SECTION\s+\d+)\s+[A-Z])/gm;
  const numberedSections = text.split(numberedPattern).map(s => s.trim()).filter(s => s.length > 20);

  if (numberedSections.length >= 3) {
    return numberedSections;
  }

  // Try ALL CAPS heading pattern
  const capsPattern = /(?=\n[A-Z][A-Z\s]{3,}\n)/g;
  const capsSections = text.split(capsPattern).map(s => s.trim()).filter(s => s.length > 20);

  if (capsSections.length >= 3) {
    return capsSections;
  }

  // Fall back to double-newline paragraph splitting
  const paragraphs = text.split(/\n\s*\n/).map(s => s.trim()).filter(s => s.length > 20);

  if (paragraphs.length >= 2) {
    return paragraphs;
  }

  // Last resort: return whole contract as one clause
  return [text];
}

// ── Extract clause heading ────────────────────────────────────────────────────
/**
 * Attempts to extract a human-readable name for the clause.
 * Looks for numbered headings, ALL CAPS titles, or uses first 60 chars.
 */
function extractClauseName(clauseText) {
  const firstLine = clauseText.split('\n')[0].trim();

  // Numbered section with title: "1. PAYMENT TERMS" or "2.3 Delivery"
  const numberedMatch = firstLine.match(/^[\d.]+\s+(.+)$/);
  if (numberedMatch && numberedMatch[1].length < 80) {
    return numberedMatch[1].trim();
  }

  // ALL CAPS heading on first line
  if (/^[A-Z][A-Z\s&/()-]{3,}$/.test(firstLine) && firstLine.length < 80) {
    return firstLine;
  }

  // Title case heading
  if (/^[A-Z][a-z]/.test(firstLine) && firstLine.length < 80 && !firstLine.includes('.')) {
    return firstLine;
  }

  // Use truncated first 60 chars
  return clauseText.substring(0, 60).replace(/\n/g, ' ').trim() + (clauseText.length > 60 ? '…' : '');
}

// ── Keyword scorer ────────────────────────────────────────────────────────────
/**
 * Scores a clause against a category's keyword list.
 * Returns a confidence score between 0 and 1.
 *
 * Scoring logic:
 * - Each keyword match adds to a hit count
 * - Longer keyword phrases score higher (more specific signal)
 * - Score is normalized and capped at 1.0
 * - Multiple matches increase confidence up to a ceiling
 */
function scoreClauseForCategory(clauseText, category) {
  const text = clauseText.toLowerCase();
  let rawScore = 0;
  let hits = 0;

  for (const keyword of category.keywords) {
    if (text.includes(keyword.toLowerCase())) {
      // Longer keywords are more specific → higher signal value
      const keywordValue = Math.min(1.0, 0.3 + (keyword.length / 30));
      rawScore += keywordValue;
      hits++;
    }
  }

  if (hits === 0) return 0;

  // Normalize: first hit gives base score, additional hits give diminishing returns
  // Formula: base(0.45) + logarithmic bonus for multi-hit confidence
  const normalized = Math.min(1.0, 0.45 + (Math.log(hits + 1) / Math.log(10)) * 0.55);

  return Math.round(normalized * 100) / 100;
}

// ── Simple embedding cache ────────────────────────────────────────────────────
// Caches classification results for identical clause text to avoid redundant work.
// Key: first 100 chars of clause (fast hash proxy). Value: classification result.
const classificationCache = new Map();
const CACHE_MAX_SIZE = 500; // prevent unbounded memory growth

function getCacheKey(text) {
  return text.substring(0, 100).toLowerCase().replace(/\s+/g, ' ');
}

// ── Main classifier ───────────────────────────────────────────────────────────
/**
 * Classifies a single clause into one or more tags with confidence scores.
 * Uses hybrid approach:
 *   1. Check cache first
 *   2. Score against all category keyword rules
 *   3. Include tags above confidence threshold
 *   4. Always include at least the highest-scoring tag
 *
 * @param {string} clauseText - Raw clause text
 * @param {number} [threshold=0.45] - Minimum confidence to include a tag
 * @returns {{ tags: string[], scores: Object, confidence: number }}
 */
function classifyClause(clauseText, threshold = 0.45) {
  const cacheKey = getCacheKey(clauseText);

  // Return cached result if available
  if (classificationCache.has(cacheKey)) {
    return classificationCache.get(cacheKey);
  }

  const scores = {};
  let highestScore = 0;
  let highestTag = null;

  // Score against all categories
  for (const category of CATEGORY_RULES) {
    const score = scoreClauseForCategory(clauseText, category);
    scores[category.tag] = score;
    if (score > highestScore) {
      highestScore = score;
      highestTag = category.tag;
    }
  }

  // Collect tags above threshold
  const tags = Object.entries(scores)
    .filter(([, score]) => score >= threshold)
    .sort(([, a], [, b]) => b - a)
    .map(([tag]) => tag);

  // Always include at least the top tag if any signal detected
  if (tags.length === 0 && highestScore > 0.15 && highestTag) {
    tags.push(highestTag);
  }

  const result = {
    tags,
    scores,
    confidence: highestScore
  };

  // Cache result (with size limit)
  if (classificationCache.size >= CACHE_MAX_SIZE) {
    // Evict oldest entry
    const firstKey = classificationCache.keys().next().value;
    classificationCache.delete(firstKey);
  }
  classificationCache.set(cacheKey, result);

  return result;
}

// ── Batch contract classifier ─────────────────────────────────────────────────
/**
 * Main export. Takes a full contract string and returns:
 * - Array of classified clauses with tags and confidence scores
 * - Summary statistics for logging
 *
 * @param {string} contractText - Full contract text
 * @returns {{ clauses: Array, stats: Object, taggedSummary: string }}
 */
function classifyContract(contractText) {
  const rawClauses = splitIntoClauses(contractText);

  const clauses = rawClauses.map((text, index) => {
    const name = extractClauseName(text);
    const classification = classifyClause(text);

    return {
      index: index + 1,
      name,
      clause_text: text,
      tags: classification.tags,
      scores: classification.scores,
      confidence: classification.confidence,
      classified: classification.tags.length > 0
    };
  });

  // Build statistics for logging
  const tagCounts = {};
  let classifiedCount = 0;
  for (const clause of clauses) {
    if (clause.classified) classifiedCount++;
    for (const tag of clause.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const stats = {
    total: clauses.length,
    classified: classifiedCount,
    unclassified: clauses.length - classifiedCount,
    tagCounts
  };

  // Build a compact summary for injection into the AI prompt
  // Format: "Section 1 (PAYMENT, ACCEPTANCE): Payment due within 7 days..."
  const taggedSummary = clauses
    .map(c => {
      const tagStr = c.tags.length > 0 ? `[${c.tags.join(', ')}]` : '[UNCLASSIFIED]';
      const preview = c.clause_text.substring(0, 120).replace(/\n/g, ' ').trim();
      return `${c.name} ${tagStr}: ${preview}${c.clause_text.length > 120 ? '…' : ''}`;
    })
    .join('\n');

  return { clauses, stats, taggedSummary };
}

module.exports = { classifyContract, classifyClause, splitIntoClauses };