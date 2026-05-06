<<<<<<< HEAD
# AI Contract Analyzer (Express + React)

No Netlify. Just Node.js + React.

## Quick Start

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Add your API key
```bash
cp .env.example .env
# Edit .env and paste your ANTHROPIC_API_KEY
```

### 3. Run (both server + client together)
```bash
npm run dev
```

- Frontend → http://localhost:3000  
- Backend  → http://localhost:5000

---

## Project Structure

```
ai-contract-analyzer/
├── server/
│   └── index.js          ← Express server (all backend logic)
├── client/
│   ├── public/
│   │   └── sample-contract.txt
│   └── src/
│       ├── App.jsx
│       ├── components/   ← Header, InputPanel, IssueCard, etc.
│       ├── hooks/        ← useContractAnalyzer.js
│       └── utils/        ← pdfExport.js
├── package.json          ← Root: runs both server + client
└── .env                  ← Your API key goes here
```

## Production Build

```bash
cd client && npm run build
cd ..
NODE_ENV=production node server/index.js
```

Then open http://localhost:5000
=======
# RiskRadar
>>>>>>> f23f4a7a7f4b35a034c98706be0b006770cc5af3
