import React, { useState } from "react";
import { IssueCard } from "./IssueCard";
import { downloadAnalysisAsPDF } from "../utils/pdfExport";

const RISK_CFG = {
  Critical: { color: "#ff1744", bg: "rgba(255,23,68,0.12)",  border: "rgba(255,23,68,0.35)" },
  High:     { color: "#ff4d6d", bg: "rgba(255,77,109,0.10)", border: "rgba(255,77,109,0.30)" },
  Medium:   { color: "#f4a942", bg: "rgba(244,169,66,0.10)", border: "rgba(244,169,66,0.30)" },
  Low:      { color: "#3ecf8e", bg: "rgba(62,207,142,0.10)", border: "rgba(62,207,142,0.30)" },
};

const TAG_COLORS = {
  PAYMENT:              { color: "#f4a942", bg: "rgba(244,169,66,0.12)" },
  ACCEPTANCE:           { color: "#ff4d6d", bg: "rgba(255,77,109,0.12)" },
  TERMINATION:          { color: "#ff1744", bg: "rgba(255,23,68,0.12)" },
  DELIVERY:             { color: "#7c6af7", bg: "rgba(124,106,247,0.12)" },
  COMPLETION:           { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  INTELLECTUAL_PROPERTY:{ color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  LIABILITY:            { color: "#fb7185", bg: "rgba(251,113,133,0.12)" },
  REVISION:             { color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  CONFIDENTIALITY:      { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  DISPUTE:              { color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
};

const SCENARIO_TYPE_CFG = {
  PAYMENT_LOSS:       { label: "💸 Payment Loss",      color: "#f4a942", bg: "rgba(244,169,66,0.12)",  border: "rgba(244,169,66,0.25)" },
  ACCEPTANCE_TRAP:    { label: "🪤 Acceptance Trap",   color: "#ff4d6d", bg: "rgba(255,77,109,0.12)", border: "rgba(255,77,109,0.25)" },
  OWNERSHIP_BLOCK:    { label: "🔒 Ownership Block",   color: "#ff1744", bg: "rgba(255,23,68,0.12)",  border: "rgba(255,23,68,0.35)" },
  TERMINATION_EXPLOIT:{ label: "🚪 Termination Exploit",color: "#a78bfa", bg: "rgba(167,139,250,0.12)",border: "rgba(167,139,250,0.25)" },
  OTHER:              { label: "⚡ Exploit",            color: "#9896b0", bg: "rgba(152,150,176,0.10)",border: "rgba(152,150,176,0.20)" },
};

const TABS = ["Issues", "Exploit Chains", "Abuse Scenarios", "Top 5 Fixes"];

export function ResultsPanel({ analysis, onReset }) {
  const [tab, setTab]       = useState("Issues");
  const [filter, setFilter] = useState("All");

  const issues      = analysis?.issues || [];
  const combined    = analysis?.combined_risks || [];
  const simulations = analysis?.abuse_simulations || [];
  const topFixes    = analysis?.top_fixes || [];
  const overallRisk = analysis?.overall_risk || "Medium";
  const cfg         = RISK_CFG[overallRisk] || RISK_CFG.Medium;

  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  issues.forEach(i => { if (counts[i.risk_level] !== undefined) counts[i.risk_level]++; });

  const criticalChains = combined.filter(c => c.severity === "Critical").length;
  const filtered       = filter === "All" ? issues : issues.filter(i => i.risk_level === filter);

  return (
    <div style={s.wrapper}>

      {/* ── Summary banner ── */}
      <div style={{ ...s.banner, borderColor: cfg.border, background: `linear-gradient(135deg, ${cfg.bg}, rgba(9,9,15,0))` }}>
        <div style={s.bannerTop}>
          <div>
            <div style={s.bannerLabel}>Overall Risk</div>
            <div style={{ ...s.bannerRisk, color: cfg.color }}>{overallRisk}</div>
          </div>
          <div style={s.counts}>
            {["Critical","High","Medium","Low"].map(lvl => {
              const c = RISK_CFG[lvl];
              return (
                <div key={lvl} style={{ ...s.countBox, background: c.bg, border: `1px solid ${c.border}` }}>
                  <span style={{ color: c.color, fontWeight: 700, fontSize: "1.1rem" }}>{counts[lvl]}</span>
                  <span style={{ color: c.color, fontSize: "0.68rem", opacity: 0.85 }}>{lvl}</span>
                </div>
              );
            })}
            {criticalChains > 0 && (
              <div style={{ ...s.countBox, background: RISK_CFG.Critical.bg, border: `1px solid ${RISK_CFG.Critical.border}` }}>
                <span style={{ color: RISK_CFG.Critical.color, fontWeight: 700, fontSize: "1.1rem" }}>{criticalChains}</span>
                <span style={{ color: RISK_CFG.Critical.color, fontSize: "0.68rem", opacity: 0.85 }}>Chains</span>
              </div>
            )}
          </div>
        </div>
        {analysis?.summary && <p style={s.summary}>{analysis.summary}</p>}
      </div>

      {/* ── Actions ── */}
      <div style={s.actions}>
        <button style={s.resetBtn} onClick={onReset}>↩ Analyze Another</button>
        <button style={s.dlBtn} onClick={() => downloadAnalysisAsPDF(analysis)}>↓ Download Report</button>
      </div>

      {/* ── Tabs ── */}
      <div style={s.tabs}>
        {TABS.map(t => {
          const badge =
            t === "Issues"          ? issues.length :
            t === "Exploit Chains"  ? combined.length :
            t === "Abuse Scenarios" ? simulations.length : null;
          const badgeColor =
            t === "Exploit Chains"  ? "#ff4d6d" :
            t === "Abuse Scenarios" ? "#f4a942" : "#7c6af7";
          return (
            <button key={t} style={{ ...s.tab, ...(tab===t ? s.tabActive : {}) }} onClick={() => setTab(t)}>
              {t}
              {badge !== null && (
                <span style={{ ...s.tabCount, ...(tab===t ? { background:`${badgeColor}22`, color:badgeColor } : {}) }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Issues tab ── */}
      {tab === "Issues" && (
        <div>
          <div style={s.filters}>
            {["All","Critical","High","Medium","Low"].map(f => {
              const fc = RISK_CFG[f] || {};
              const isA = filter === f;
              return (
                <button key={f} onClick={() => setFilter(f)} style={{ ...s.filterBtn,
                  ...(isA ? { background: f==="All"?"rgba(124,106,247,0.15)":fc.bg, color: f==="All"?"#7c6af7":fc.color, border:`1px solid ${f==="All"?"rgba(124,106,247,0.3)":fc.border}` } : {})
                }}>
                  {f} <span style={{ fontSize:"0.68rem", opacity:0.7 }}>({f==="All"?issues.length:counts[f]})</span>
                </button>
              );
            })}
          </div>
          <div style={s.list}>
            {filtered.length === 0
              ? <EmptyState label="No issues at this level" />
              : filtered.map((issue, i) => <IssueCard key={i} issue={issue} index={i} />)
            }
          </div>
        </div>
      )}

      {/* ── Exploit Chains tab ── */}
      {tab === "Exploit Chains" && (
        <div style={s.list}>
          {combined.length === 0
            ? <EmptyState label="No cross-clause chains detected" />
            : combined.map((cr, i) => <ExploitChainCard key={i} cr={cr} index={i} />)
          }
        </div>
      )}

      {/* ── Abuse Scenarios tab ── */}
      {tab === "Abuse Scenarios" && (
        <div>
          {/* Scenario type legend */}
          <div style={s.legend}>
            {Object.entries(SCENARIO_TYPE_CFG).filter(([k]) => k !== "OTHER").map(([k, v]) => (
              <span key={k} style={{ ...s.legendPill, color: v.color, background: v.bg, border: `1px solid ${v.border}` }}>
                {v.label}
              </span>
            ))}
          </div>
          <div style={s.list}>
            {simulations.length === 0
              ? <EmptyState label="No abuse scenarios generated" />
              : simulations.map((sim, i) => <SimulationCard key={i} sim={sim} index={i} />)
            }
          </div>
        </div>
      )}

      {/* ── Top 5 Fixes tab ── */}
      {tab === "Top 5 Fixes" && (
        <div style={s.list}>
          {topFixes.length === 0
            ? <EmptyState label="No prioritized fixes generated" />
            : topFixes.map((fix, i) => <FixCard key={i} fix={fix} />)
          }
        </div>
      )}

      <p style={s.disclaimer}>
        AI-generated analysis for informational purposes only. Not legal advice. Consult a qualified attorney.
      </p>
    </div>
  );
}

// ── Exploit Chain Card ────────────────────────────────────────────────────────
function ExploitChainCard({ cr }) {
  const [expanded, setExpanded] = useState(true);
  const sev = cr.severity === "Critical" ? RISK_CFG.Critical : RISK_CFG.High;

  return (
    <div style={{ ...s.crCard, borderLeft: `3px solid ${sev.color}` }}>
      <div style={s.crHeader} onClick={() => setExpanded(v => !v)} role="button" tabIndex={0}
        onKeyDown={e => e.key === "Enter" && setExpanded(v => !v)}>
        <div style={s.crHeaderLeft}>
          <span style={{ ...s.crBadge, color: sev.color, background: sev.bg, border:`1px solid ${sev.border}` }}>
            🔗 {cr.severity}
          </span>
          <div style={s.crClauses}>
            {(cr.clauses_involved || []).map((c, i) => (
              <span key={i} style={s.clausePill}>{c}</span>
            ))}
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5c5a72" strokeWidth="2" strokeLinecap="round"
          style={{ transition:"transform 0.2s", transform: expanded ? "rotate(180deg)" : "none", flexShrink:0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {cr.tags_involved?.length > 0 && (
        <div style={s.tagRow}>
          {cr.tags_involved.map(tag => {
            const tc = TAG_COLORS[tag] || { color:"#9896b0", bg:"rgba(152,150,176,0.1)" };
            return <span key={tag} style={{ ...s.tag, color:tc.color, background:tc.bg }}>{tag.replace("_"," ")}</span>;
          })}
        </div>
      )}

      {cr.what_combination_creates && (
        <div style={s.combinationInsight}>
          <span style={s.insightLabel}>💡 EMERGENT RISK</span>
          <span style={s.insightText}>{cr.what_combination_creates}</span>
        </div>
      )}

      {expanded && (
        <div style={s.crBody}>
          <div style={s.chainLabel}>Exploit Chain</div>
          <div style={s.chainSteps}>
            {(cr.exploit_chain || []).map((step, i) => (
              <div key={i} style={s.chainStep}>
                <div style={s.chainStepNum}>{i + 1}</div>
                <p style={s.chainStepText}>{step}</p>
              </div>
            ))}
          </div>
          {cr.impact && (
            <div style={s.impactBox}>
              <span style={s.impactLabel}>💰 Impact</span>
              <span style={s.impactText}>{cr.impact}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Simulation Card ───────────────────────────────────────────────────────────
function SimulationCard({ sim, index }) {
  const [expanded, setExpanded] = useState(true);
  const typeCfg = SCENARIO_TYPE_CFG[sim.scenario_type] || SCENARIO_TYPE_CFG.OTHER;

  return (
    <div style={{ ...s.simCard, borderLeft: `3px solid ${typeCfg.color}` }}>

      {/* Header */}
      <div style={s.simHeader} onClick={() => setExpanded(v => !v)} role="button" tabIndex={0}
        onKeyDown={e => e.key === "Enter" && setExpanded(v => !v)}>
        <div style={s.simHeaderLeft}>
          <span style={s.simNum}>{index + 1}</span>
          <div>
            {sim.scenario_type && (
              <span style={{ ...s.scenarioTypeBadge, color: typeCfg.color, background: typeCfg.bg, border: `1px solid ${typeCfg.border}` }}>
                {typeCfg.label}
              </span>
            )}
            <div style={s.simTitle}>{sim.title}</div>
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5c5a72" strokeWidth="2" strokeLinecap="round"
          style={{ transition:"transform 0.2s", transform: expanded ? "rotate(180deg)" : "none", flexShrink:0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Clauses exploited pills */}
      {sim.clauses_exploited?.length > 0 && (
        <div style={s.simClauses}>
          <span style={s.simClausesLabel}>Clauses:</span>
          {sim.clauses_exploited.map((c, i) => (
            <span key={i} style={s.clausePill}>{c}</span>
          ))}
        </div>
      )}

      {expanded && (
        <div style={s.simBody}>
          {/* Steps */}
          <div style={s.chainLabel}>How It Happens</div>
          <div style={s.simSteps}>
            {(sim.steps || []).map((step, i) => (
              <div key={i} style={s.simStep}>
                <span style={s.stepNum}>{i + 1}</span>
                <span style={s.stepText}>{step}</span>
              </div>
            ))}
          </div>

          {/* Impact row */}
          <div style={s.impactRow}>
            {sim.financial_impact && (
              <div style={{ ...s.impactBox, flex:1 }}>
                <span style={s.impactLabel}>💰 Financial</span>
                <span style={s.impactText}>{sim.financial_impact}</span>
              </div>
            )}
            {sim.legal_impact && (
              <div style={{ ...s.legalImpactBox, flex:1 }}>
                <span style={s.legalImpactLabel}>⚖ Legal</span>
                <span style={s.legalImpactText}>{sim.legal_impact}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Fix Card ──────────────────────────────────────────────────────────────────
function FixCard({ fix }) {
  return (
    <div style={s.fixCard}>
      <div style={s.fixRank}>#{fix.rank}</div>
      <div style={s.fixBody}>
        <div style={s.fixIssue}>{fix.issue}</div>
        {fix.why_urgent && <p style={s.fixWhy}>⚠ {fix.why_urgent}</p>}
        {fix.action     && <p style={s.fixAction}>→ {fix.action}</p>}
      </div>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div style={s.empty}>
      <span style={{ fontSize:"1.5rem" }}>∅</span>
      <p style={{ color:"#9896b0", fontSize:"0.85rem" }}>{label}</p>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  wrapper:            { display:"flex", flexDirection:"column", gap:14 },
  banner:             { border:"1px solid", borderRadius:16, padding:"18px 20px" },
  bannerTop:          { display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:12 },
  bannerLabel:        { fontSize:"0.68rem", color:"#5c5a72", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 },
  bannerRisk:         { fontFamily:"'DM Serif Display',serif", fontSize:"1.6rem", lineHeight:1 },
  counts:             { display:"flex", gap:8, flexWrap:"wrap" },
  countBox:           { display:"flex", flexDirection:"column", alignItems:"center", borderRadius:10, padding:"7px 14px", minWidth:50 },
  summary:            { fontSize:"0.83rem", color:"#9896b0", lineHeight:1.65, borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:12, fontStyle:"italic" },
  actions:            { display:"flex", gap:10 },
  resetBtn:           { background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#9896b0", borderRadius:10, padding:"8px 14px", fontSize:"0.8rem", fontFamily:"'DM Sans',sans-serif", cursor:"pointer" },
  dlBtn:              { flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#7c6af7,#5b4de0)", border:"none", color:"#fff", borderRadius:10, padding:"8px 14px", fontSize:"0.8rem", fontFamily:"'DM Sans',sans-serif", fontWeight:600, cursor:"pointer" },
  tabs:               { display:"flex", gap:3, background:"rgba(255,255,255,0.03)", borderRadius:10, padding:3, flexWrap:"wrap" },
  tab:                { flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 10px", borderRadius:8, border:"none", background:"transparent", color:"#9896b0", fontSize:"0.78rem", fontFamily:"'DM Sans',sans-serif", cursor:"pointer", whiteSpace:"nowrap" },
  tabActive:          { background:"#1e1e30", color:"#f0eff8", boxShadow:"0 1px 4px rgba(0,0,0,0.4)" },
  tabCount:           { background:"rgba(255,255,255,0.07)", color:"#5c5a72", borderRadius:10, padding:"1px 7px", fontSize:"0.68rem", fontWeight:600 },
  filters:            { display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 },
  filterBtn:          { background:"transparent", border:"1px solid rgba(255,255,255,0.08)", color:"#9896b0", borderRadius:8, padding:"5px 12px", fontSize:"0.78rem", fontFamily:"'DM Sans',sans-serif", cursor:"pointer" },
  list:               { display:"flex", flexDirection:"column", gap:12 },
  legend:             { display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 },
  legendPill:         { fontSize:"0.68rem", fontWeight:600, padding:"3px 10px", borderRadius:20 },

  // Exploit chain
  crCard:             { background:"#13131f", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, overflow:"hidden" },
  crHeader:           { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px 10px", cursor:"pointer", gap:10 },
  crHeaderLeft:       { display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", flex:1 },
  crBadge:            { fontSize:"0.72rem", fontWeight:700, borderRadius:20, padding:"3px 10px", whiteSpace:"nowrap" },
  crClauses:          { display:"flex", gap:5, flexWrap:"wrap" },
  clausePill:         { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"2px 8px", fontSize:"0.7rem", color:"#9896b0" },
  tagRow:             { display:"flex", gap:5, flexWrap:"wrap", padding:"0 16px 10px" },
  tag:                { fontSize:"0.65rem", fontWeight:600, padding:"2px 8px", borderRadius:10, letterSpacing:"0.04em" },
  combinationInsight: { margin:"0 16px 10px", background:"rgba(124,106,247,0.07)", border:"1px solid rgba(124,106,247,0.18)", borderRadius:8, padding:"9px 12px", display:"flex", gap:8, alignItems:"flex-start" },
  insightLabel:       { fontSize:"0.62rem", fontWeight:700, color:"#7c6af7", whiteSpace:"nowrap", paddingTop:1, letterSpacing:"0.06em" },
  insightText:        { fontSize:"0.82rem", color:"#a09ac8", lineHeight:1.55 },
  crBody:             { padding:"0 16px 16px" },
  chainLabel:         { fontSize:"0.68rem", fontWeight:700, color:"#5c5a72", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 },
  chainSteps:         { display:"flex", flexDirection:"column", gap:8, marginBottom:10 },
  chainStep:          { display:"flex", gap:10, alignItems:"flex-start" },
  chainStepNum:       { width:22, height:22, borderRadius:"50%", background:"rgba(255,77,109,0.15)", border:"1px solid rgba(255,77,109,0.3)", color:"#ff4d6d", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", fontWeight:700, flexShrink:0, marginTop:2 },
  chainStepText:      { fontSize:"0.82rem", color:"#c8b0b8", lineHeight:1.6 },
  impactBox:          { display:"flex", gap:8, background:"rgba(255,77,109,0.07)", border:"1px solid rgba(255,77,109,0.18)", borderRadius:8, padding:"9px 12px", alignItems:"flex-start" },
  impactLabel:        { fontSize:"0.63rem", fontWeight:700, color:"#ff4d6d", whiteSpace:"nowrap", paddingTop:1 },
  impactText:         { fontSize:"0.81rem", color:"#c8a0a8", lineHeight:1.5 },

  // Simulation card
  simCard:            { background:"#13131f", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, overflow:"hidden" },
  simHeader:          { display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"14px 16px 8px", cursor:"pointer", gap:10 },
  simHeaderLeft:      { display:"flex", alignItems:"flex-start", gap:10, flex:1 },
  simNum:             { width:26, height:26, borderRadius:"50%", background:"rgba(255,255,255,0.06)", color:"#9896b0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.78rem", fontWeight:700, flexShrink:0, marginTop:2 },
  scenarioTypeBadge:  { display:"inline-block", fontSize:"0.65rem", fontWeight:700, borderRadius:20, padding:"2px 8px", marginBottom:4 },
  simTitle:           { fontSize:"0.9rem", fontWeight:600, color:"#e8e7f5", lineHeight:1.35 },
  simClauses:         { display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", padding:"0 16px 10px" },
  simClausesLabel:    { fontSize:"0.65rem", color:"#5c5a72", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" },
  simBody:            { padding:"0 16px 16px" },
  simSteps:           { display:"flex", flexDirection:"column", gap:8, marginBottom:12 },
  simStep:            { display:"flex", gap:10, alignItems:"flex-start" },
  stepNum:            { width:20, height:20, borderRadius:"50%", background:"rgba(255,255,255,0.06)", color:"#5c5a72", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.68rem", fontWeight:700, flexShrink:0, marginTop:1 },
  stepText:           { fontSize:"0.83rem", color:"#b8b6d0", lineHeight:1.6 },
  impactRow:          { display:"flex", gap:8, flexWrap:"wrap" },
  legalImpactBox:     { display:"flex", gap:8, background:"rgba(124,106,247,0.07)", border:"1px solid rgba(124,106,247,0.18)", borderRadius:8, padding:"9px 12px", alignItems:"flex-start" },
  legalImpactLabel:   { fontSize:"0.63rem", fontWeight:700, color:"#7c6af7", whiteSpace:"nowrap", paddingTop:1 },
  legalImpactText:    { fontSize:"0.81rem", color:"#a09ac8", lineHeight:1.5 },

  // Fix card
  fixCard:            { background:"#13131f", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 16px", display:"flex", gap:14, alignItems:"flex-start" },
  fixRank:            { width:32, height:32, borderRadius:"50%", background:"rgba(124,106,247,0.15)", border:"1px solid rgba(124,106,247,0.3)", color:"#7c6af7", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.85rem", fontWeight:700, flexShrink:0 },
  fixBody:            { flex:1 },
  fixIssue:           { fontSize:"0.9rem", fontWeight:600, color:"#e8e7f5", marginBottom:6 },
  fixWhy:             { fontSize:"0.8rem", color:"#ff8a9a", lineHeight:1.55, marginBottom:5 },
  fixAction:          { fontSize:"0.8rem", color:"#9896b0", lineHeight:1.55 },

  empty:              { display:"flex", flexDirection:"column", alignItems:"center", gap:8, padding:"40px", textAlign:"center", background:"#13131f", borderRadius:12, border:"1px solid rgba(255,255,255,0.06)" },
  disclaimer:         { fontSize:"0.7rem", color:"#5c5a72", textAlign:"center", lineHeight:1.6 },
};
