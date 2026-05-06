/**
 * App.jsx
 * Root component — orchestrates the layout and state flow.
 *
 * Layout:
 *  - Header (sticky top)
 *  - Hero blurb
 *  - Two-column panel:
 *      Left  → InputPanel (paste / upload)
 *      Right → Results / Loading / Empty state
 */

import React from "react";
import { Header } from "./components/Header";
import { InputPanel } from "./components/InputPanel";
import { ResultsPanel } from "./components/ResultsPanel";
import { LoadingPanel } from "./components/LoadingPanel";
import { useContractAnalyzer } from "./hooks/useContractAnalyzer";

// ── Keyframes injected once at app level ──────────────────────────────────
const GLOBAL_KEYFRAMES = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50%       { opacity: 1; }
  }
  textarea:focus {
    border-color: rgba(124,106,247,0.5) !important;
    box-shadow: 0 0 0 3px rgba(124,106,247,0.1);
  }
  button:hover:not(:disabled) {
    filter: brightness(1.08);
  }
`;

export default function App() {
  const analyzer = useContractAnalyzer();

  return (
    <>
      {/* Inject global keyframe animations */}
      <style>{GLOBAL_KEYFRAMES}</style>

      <div style={styles.app}>
        <Header />

        <main style={styles.main}>
          {/* ── Hero ── */}
          <section style={styles.hero}>
            <h2 style={styles.heroTitle}>
              Detect Legal Risks in Seconds
            </h2>
            <p style={styles.heroSub}>
              Paste or upload any contract. Our AI pinpoints loopholes, missing clauses,
              and one-sided terms — with plain-English explanations and ready-to-use fixes.
            </p>

            {/* Feature pills */}
            <div style={styles.pills}>
              {[
                "⚠ Risky Clauses",
                "📋 Missing Provisions",
                "⚖ One-sided Terms",
                "💡 Suggested Fixes",
                "📝 Rewritten Clauses",
                "📄 PDF Report",
              ].map((pill) => (
                <span key={pill} style={styles.pill}>{pill}</span>
              ))}
            </div>
          </section>

          {/* ── Main two-column panel ── */}
          <div style={styles.columns}>
            {/* LEFT: Input */}
            <div style={styles.leftCol}>
              <div style={styles.panelCard}>
                <div style={styles.panelTitle}>
                  <PanelIcon />
                  Your Contract
                </div>
                <InputPanel
                  activeTab={analyzer.activeTab}
                  setActiveTab={analyzer.setActiveTab}
                  contractText={analyzer.contractText}
                  setContractText={analyzer.setContractText}
                  uploadedFile={analyzer.uploadedFile}
                  handleFileSelect={analyzer.handleFileSelect}
                  onAnalyze={analyzer.analyze}
                  onLoadSample={analyzer.loadSample}
                  loading={analyzer.loading}
                  error={analyzer.error}
                />
              </div>
            </div>

            {/* RIGHT: Results / Loading / Empty */}
            <div style={styles.rightCol}>
              {analyzer.loading ? (
                <div style={styles.panelCard}>
                  <LoadingPanel stage={analyzer.loadingStage} />
                </div>
              ) : analyzer.analysis ? (
                <div style={{ animation: "fadeIn 0.4s ease" }}>
                  <ResultsPanel
                    analysis={analyzer.analysis}
                    onReset={analyzer.reset}
                  />
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </main>

        <footer style={styles.footer}>
          <p>
            RiskRadar — For informational purposes only, not legal advice.
            &nbsp;·&nbsp;
            <span style={{ color: "#7c6af7" }}>RiskRadar</span>
          </p>
        </footer>
      </div>
    </>
  );
}

// ── Empty state shown before any analysis ─────────────────────────────────
function EmptyState() {
  return (
    <div style={styles.emptyWrapper}>
      {/* Decorative document illustration */}
      <div style={styles.emptyDoc} aria-hidden="true">
        <svg width="64" height="80" viewBox="0 0 64 80" fill="none">
          <rect x="4" y="4" width="56" height="72" rx="6" fill="#13131f" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
          <rect x="4" y="4" width="56" height="16" rx="6" fill="#1a1a2e" />
          <rect x="4" y="14" width="56" height="6" fill="#1a1a2e" />
          {[28, 38, 48, 58].map((y, i) => (
            <rect key={y} x="14" y={y} width={i % 2 === 0 ? 36 : 26} height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
          ))}
          {/* Warning highlight */}
          <rect x="14" y="35" width="36" height="6" rx="2" fill="rgba(255,77,109,0.12)" />
          <rect x="14" y="35" width="36" height="6" rx="2" stroke="rgba(255,77,109,0.3)" strokeWidth="1" />
        </svg>
      </div>

      <h3 style={styles.emptyTitle}>Your analysis will appear here</h3>
      <p style={styles.emptySub}>
        Paste your contract text or upload a PDF / DOCX file,
        then click <strong style={{ color: "#7c6af7" }}>Analyze Contract</strong>.
      </p>

      <div style={styles.emptyFeatures}>
        {[
          { icon: "🔍", text: "Vague & ambiguous language" },
          { icon: "📋", text: "Missing critical clauses" },
          { icon: "⚖️",  text: "One-sided provisions" },
          { icon: "💰", text: "Risky payment & indemnity terms" },
          { icon: "🔗", text: "Internal inconsistencies" },
          { icon: "✏️",  text: "Rewritten safer clauses" },
        ].map(({ icon, text }) => (
          <div key={text} style={styles.emptyFeature}>
            <span style={styles.emptyFeatureIcon}>{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────
const PanelIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: 7 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

// ── Styles ────────────────────────────────────────────────────────────────
const styles = {
  app: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "radial-gradient(ellipse at 20% 0%, rgba(124,106,247,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(91,77,224,0.05) 0%, transparent 60%), #09090f",
  },
  main: {
    flex: 1,
    maxWidth: 1160,
    margin: "0 auto",
    padding: "32px 20px 48px",
    width: "100%",
  },
  hero: {
    textAlign: "center",
    marginBottom: 40,
    padding: "0 20px",
  },
  heroTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
    color: "#f0eff8",
    fontWeight: 400,
    lineHeight: 1.2,
    marginBottom: 14,
  },
  heroSub: {
    fontSize: "clamp(0.88rem, 2vw, 1rem)",
    color: "#9896b0",
    maxWidth: 560,
    margin: "0 auto 20px",
    lineHeight: 1.7,
  },
  pills: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  pill: {
    fontSize: "0.75rem",
    padding: "5px 12px",
    borderRadius: 20,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#9896b0",
    letterSpacing: "0.02em",
  },
  columns: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)",
    gap: 24,
    alignItems: "start",
  },
  leftCol: {},
  rightCol: {},
  panelCard: {
    background: "#10101a",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 18,
    padding: "22px 20px",
  },
  panelTitle: {
    display: "flex",
    alignItems: "center",
    fontFamily: "'DM Serif Display', serif",
    fontSize: "1rem",
    color: "#d4d2e8",
    marginBottom: 18,
    fontWeight: 400,
  },
  // Empty state
  emptyWrapper: {
    background: "#10101a",
    border: "1px dashed rgba(255,255,255,0.1)",
    borderRadius: 18,
    padding: "48px 32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 16,
    minHeight: 500,
    justifyContent: "center",
  },
  emptyDoc: {
    opacity: 0.7,
  },
  emptyTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "1.25rem",
    color: "#d4d2e8",
    fontWeight: 400,
  },
  emptySub: {
    fontSize: "0.85rem",
    color: "#9896b0",
    maxWidth: 320,
    lineHeight: 1.65,
  },
  emptyFeatures: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px 24px",
    marginTop: 10,
    textAlign: "left",
  },
  emptyFeature: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: "0.82rem",
    color: "#9896b0",
  },
  emptyFeatureIcon: {
    fontSize: "1rem",
    width: 24,
    textAlign: "center",
  },
  footer: {
    borderTop: "1px solid rgba(255,255,255,0.06)",
    padding: "18px 24px",
    textAlign: "center",
    fontSize: "0.75rem",
    color: "#5c5a72",
  },
};
