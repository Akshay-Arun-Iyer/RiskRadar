import React, { useState } from "react";

const RISK = {
  High:   { color: "#ff4d6d", bg: "rgba(255,77,109,0.08)",  border: "rgba(255,77,109,0.25)",  icon: "⚠" },
  Medium: { color: "#f4a942", bg: "rgba(244,169,66,0.08)",  border: "rgba(244,169,66,0.25)",  icon: "◆" },
  Low:    { color: "#3ecf8e", bg: "rgba(62,207,142,0.08)",  border: "rgba(62,207,142,0.25)",  icon: "●" },
};

export function IssueCard({ issue, index }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const risk = RISK[issue.risk_level] || RISK.Low;

  const copy = () => {
    navigator.clipboard.writeText(issue.revised_clause || "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ ...s.card, borderLeft: `3px solid ${risk.color}` }}>

      {/* Header */}
      <div style={s.header} onClick={() => setExpanded(v => !v)}
        role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && setExpanded(v => !v)}>
        <div style={s.headerLeft}>
          <span style={{ ...s.num, color: risk.color, borderColor: risk.border, background: risk.bg }}>
            {index + 1}
          </span>
          <div>
            <div style={s.sectionLabel}>{issue.section || "Unknown Section"}</div>
            <div style={s.issueText}>{issue.issue}</div>
          </div>
        </div>
        <div style={s.headerRight}>
          <span style={{ ...s.badge, color: risk.color, background: risk.bg, border: `1px solid ${risk.border}` }}>
            {risk.icon} {issue.risk_level} Risk
          </span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5c5a72"
            strokeWidth="2" strokeLinecap="round"
            style={{ transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none", flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Root cause — always visible */}
      {issue.root_cause && (
        <div style={s.rootCauseBar}>
          <span style={s.rootCauseLabel}>🔎 ROOT CAUSE</span>
          <span style={s.rootCauseText}>{issue.root_cause}</span>
        </div>
      )}

      {/* Exploit — always visible */}
      {issue.exploit && (
        <div style={s.exploitBar}>
          <span style={s.exploitLabel}>⚡ EXPLOIT</span>
          <span style={s.exploitText}>{issue.exploit}</span>
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div style={s.body}>
          <hr style={s.divider} />

          {issue.fix && (
            <div style={s.section2}>
              <div style={{ ...s.label, color: "#7c6af7" }}>🔧 How This Exploit Is Eliminated</div>
              <p style={s.bodyText}>{issue.fix}</p>
            </div>
          )}

          {issue.revised_clause && (
            <div style={s.section2}>
              <div style={s.revisedHeader}>
                <div style={{ ...s.label, color: "#3ecf8e" }}>✏ Abuse-Resistant Clause</div>
                <button style={s.copyBtn} onClick={copy}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <pre style={s.revised}>{issue.revised_clause}</pre>
            </div>
          )}
        </div>
      )}

      {!expanded && (
        <button style={s.hint} onClick={() => setExpanded(true)}>
          View elimination fix & rewritten clause ↓
        </button>
      )}
    </div>
  );
}

const s = {
  card: { background: "#13131f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "16px 18px 10px", cursor: "pointer", gap: 12 },
  headerLeft: { display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 },
  headerRight: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  num: { width: 26, height: 26, borderRadius: "50%", border: "1.5px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0, marginTop: 2 },
  sectionLabel: { fontSize: "0.7rem", color: "#5c5a72", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 },
  issueText: { fontSize: "0.88rem", fontWeight: 600, color: "#e8e7f5", lineHeight: 1.4 },
  badge: { fontSize: "0.7rem", fontWeight: 600, borderRadius: 20, padding: "3px 10px", whiteSpace: "nowrap" },
  rootCauseBar: { margin: "0 18px 6px 56px", background: "rgba(124,106,247,0.06)", border: "1px solid rgba(124,106,247,0.15)", borderRadius: 8, padding: "8px 12px", display: "flex", gap: 8, alignItems: "flex-start" },
  rootCauseLabel: { fontSize: "0.63rem", fontWeight: 700, color: "#7c6af7", letterSpacing: "0.08em", whiteSpace: "nowrap", paddingTop: 1 },
  rootCauseText: { fontSize: "0.81rem", color: "#a09ac8", lineHeight: 1.55 },
  exploitBar: { margin: "0 18px 12px 56px", background: "rgba(255,77,109,0.06)", border: "1px solid rgba(255,77,109,0.15)", borderRadius: 8, padding: "9px 12px", display: "flex", gap: 8, alignItems: "flex-start" },
  exploitLabel: { fontSize: "0.63rem", fontWeight: 700, color: "#ff4d6d", letterSpacing: "0.08em", whiteSpace: "nowrap", paddingTop: 1 },
  exploitText: { fontSize: "0.81rem", color: "#c8a0a8", lineHeight: 1.55 },
  hint: { display: "block", width: "100%", background: "transparent", border: "none", borderTop: "1px solid rgba(255,255,255,0.05)", color: "#5c5a72", fontSize: "0.73rem", padding: "9px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  body: { padding: "0 18px 18px" },
  divider: { border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: "0 0 14px" },
  section2: { marginBottom: 14 },
  label: { fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 },
  bodyText: { fontSize: "0.84rem", color: "#b8b6d0", lineHeight: 1.65 },
  revisedHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 },
  revised: { background: "#0a0a15", border: "1px solid rgba(62,207,142,0.15)", borderRadius: 10, padding: "12px 14px", fontSize: "0.79rem", color: "#c8f5e4", lineHeight: 1.7, fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" },
  copyBtn: { background: "rgba(62,207,142,0.1)", border: "1px solid rgba(62,207,142,0.25)", borderRadius: 6, color: "#3ecf8e", fontSize: "0.7rem", fontFamily: "'DM Sans', sans-serif", padding: "3px 10px", cursor: "pointer" },
};