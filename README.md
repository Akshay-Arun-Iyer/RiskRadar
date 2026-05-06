<div align="center">

# ⚖️ RiskRadar

### AI-Powered Adversarial Contract Analyzer

**Detect loopholes. Expose exploit chains. Get abuse-resistant clauses.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![License](https://img.shields.io/badge/License-MIT-7c6af7?style=flat-square)](LICENSE)

---

*Most contract tools find vague wording. RiskRadar finds how you get robbed.*

</div>

---

## 🎯 What Is This?

RiskRadar analyzes legal contracts the way an adversary would — not as a grammar checker, but as a **contract hacker**. It answers the question every party should ask before signing:

> *"How can the other side legally exploit this contract against me?"*

Upload or paste any contract and get a full adversarial breakdown in seconds.

---

## ✨ Features

### 🔍 Clause-Level Analysis
Every clause is tagged, dissected, and stress-tested for structural defects — ambiguity, unilateral control, missing dependencies, and silence mechanisms.

### 🔗 Cross-Clause Exploit Chains
Most real contract risks don't live in one clause — they emerge from combinations. RiskRadar maps **clause interaction chains** like:
- `Payment + Termination` → money kept without delivery
- `Payment + Completion + IP` → paid in full, owns nothing
- `Delivery + Acceptance + Silence` → defective work legally accepted

### 💣 Abuse Simulations
Step-by-step, realistic scenarios showing exactly how each exploit plays out in the real world — with financial and legal impact named concretely.

### 🔒 Ownership Block Detection
Detects the **"Paid But No Ownership"** trap — when a Client pays the full contract value but never legally receives the intellectual property they paid for.

### 🛠️ Exploit-Eliminating Fixes
Every fix is validated to fully close the exploit — not reduce it, not delay it. Includes rewritten clauses that are bilateral, objective, and enforceable — with actual contract language, not descriptions.

### 📊 Prioritized Risk Report
Issues ranked by financial impact and likelihood of abuse — so you know exactly what to fix first.

### 📄 PDF Export
Download a clean, formatted multi-page audit report for sharing with your team or attorney.

---

## 🖥️ Interface Preview

```
┌─────────────────────────────────────────────────────────────┐
│  Overall Risk: CRITICAL                                      │
│  Critical: 2  High: 6  Medium: 0  Low: 0  Chains: 3        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ⚠ HIGH   Section 3 — Payment Terms                    │ │
│  │ 🔎 ROOT CAUSE  Payment not linked to milestones        │ │
│  │ ⚡ EXPLOIT  Developer receives 100% upfront...         │ │
│  │          [ View fix & rewritten clause ↓ ]             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  TABS: Issues | Exploit Chains | Abuse Scenarios | Fixes    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Groq API key — free at [console.groq.com](https://console.groq.com)

### 1. Clone the repository
```bash
git clone https://github.com/Akshay-Arun-Iyer/RiskRadar.git
cd RiskRadar
```

### 2. Install dependencies
```bash
npm run install:all
```

### 3. Configure your API key
```bash
cp .env.example .env
```
Open `.env` and fill in your key:
```env
OPENAI_API_KEY=your-groq-key-here
OPENAI_API_BASE=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.3-70b-versatile
```

### 4. Run the app
```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

> **Note:** In production (`NODE_ENV=production`), the app is served at **http://localhost:5000**

---

## 📁 Project Structure

```
RiskRadar/
├── server/
│   ├── index.js                    # Express backend + AI prompt engine
│   └── clauseClassifier.js         # Clause pre-classifier and section tagger
├── client/
│   ├── public/
│   │   └── sample-contract.txt     # Built-in test contract
│   └── src/
│       ├── App.jsx                 # Root layout
│       ├── components/
│       │   ├── Header.jsx
│       │   ├── InputPanel.jsx      # Paste / file upload
│       │   ├── IssueCard.jsx       # Per-clause risk cards
│       │   ├── LoadingPanel.jsx    # Animated analysis state
│       │   └── ResultsPanel.jsx    # 4-tab results dashboard
│       ├── hooks/
│       │   └── useContractAnalyzer.js
│       └── utils/
│           └── pdfExport.js        # PDF report generator
└── package.json                    # Runs client + server together
```

---

## 🧠 How The Analysis Works

RiskRadar runs a **4-phase adversarial analysis engine**:

```
Phase 1 — Clause Analysis
  └─ Tag every clause → identify structural defect
     → validate fix eliminates exploit, not just reduces it

Phase 2 — Ownership Block Detection
  └─ Scan IP transfer conditions → detect completion control
     → flag Payment + Completion + IP as CRITICAL

Phase 3 — Cross-Clause Intelligence
  └─ Map 8 mandatory relationship checks
     → generate step-by-step exploit chains

Phase 4 — Abuse Scenario Enforcement
  └─ Minimum 3 typed scenarios required
     → each step names the clause that permits it
     → financial impact + legal impact both required
```

---

## 🎯 What RiskRadar Detects

| Risk Type | Description |
|-----------|-------------|
| 💸 Payment Loss | Upfront payments with no delivery guarantee or refund |
| 🪤 Acceptance Trap | Silence-based acceptance that binds you to defective work |
| 🔒 Ownership Block | Paying in full but never legally receiving the IP you bought |
| 🚪 Termination Exploit | One party exits while keeping your money and delivering nothing |
| ⚡ Unilateral Control | "Sole discretion", "deemed complete", "as determined by" |
| 🔗 Exploit Chains | Multi-clause combos that look fine alone but combine dangerously |
| 🤖 Data Weaponization | Perpetual data licenses and AI training rights on your business data |
| ⚖️ Rigged Arbitration | Arbitrator, venue, language, and rules all chosen by one party |

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | Your Groq API key |
| `OPENAI_API_BASE` | ✅ | `https://api.groq.com/openai/v1` |
| `OPENAI_MODEL` | Optional | Default: `llama-3.3-70b-versatile` |
| `PORT` | Optional | Server port, default `5000` |

---

## 🏗️ Production Build

```bash
cd client && npm run build
cd ..
NODE_ENV=production node server/index.js
```

Then visit **http://localhost:5000**

---

## ⚠️ Disclaimer

RiskRadar is an AI-powered tool for **informational purposes only**.  
It does not constitute legal advice.  
Always consult a qualified attorney before relying on any contract analysis.

---

## 📜 License

MIT — free to use, modify, and deploy.

---

<div align="center">

Built with ⚖️ by [Akshay Arun Iyer](https://github.com/Akshay-Arun-Iyer)

**Stop signing contracts blind.**

</div>
