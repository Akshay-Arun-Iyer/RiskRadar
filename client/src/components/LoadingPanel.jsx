/**
 * LoadingPanel.jsx
 * Animated loading state shown while the AI analyzes the contract.
 */

import React, { useEffect, useState } from "react";

const STAGES = [
  { text: "Reading contract structure…", pct: 15 },
  { text: "Building section checklist…", pct: 30 },
  { text: "Hunting for exploit patterns…", pct: 50 },
  { text: "Cross-referencing clauses…", pct: 65 },
  { text: "Simulating adversarial scenarios…", pct: 80 },
  { text: "Generating abuse-resistant fixes…", pct: 92 },
  { text: "Finalizing exploit audit…", pct: 98 },
];

export function LoadingPanel({ stage }) {
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(5);

  // Cycle through fake stages every 2.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setStageIdx((i) => {
        const next = Math.min(i + 1, STAGES.length - 1);
        setProgress(STAGES[next].pct);
        return next;
      });
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.wrapper}>
      {/* Animated orb */}
      <div style={styles.orbWrapper} aria-hidden="true">
        <div style={styles.orb}>
          <div style={styles.orbInner}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7c6af7" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
        </div>
        <div style={styles.ring1} />
        <div style={styles.ring2} />
      </div>

      <h2 style={styles.title}>RiskRadar is auditing your contract…</h2>
      <p style={styles.stage}>{stage || STAGES[stageIdx].text}</p>

      {/* Progress bar */}
      <div style={styles.barTrack}>
        <div
          style={{
            ...styles.barFill,
            width: `${progress}%`,
          }}
        />
      </div>
      <p style={styles.pct}>{progress}%</p>

      {/* Animated dots */}
      <div style={styles.dots} aria-label="Loading">
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ ...styles.dot, animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>

      {/* Inline keyframes via a style tag */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:0.4;transform:scale(0.95)} 50%{opacity:1;transform:scale(1.05)} }
        @keyframes ring { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(1.8);opacity:0} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes barShimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 24px",
    gap: 20,
    textAlign: "center",
    minHeight: 340,
  },
  orbWrapper: {
    position: "relative",
    width: 100,
    height: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  orb: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "radial-gradient(circle at 35% 35%, rgba(124,106,247,0.4), rgba(91,77,224,0.15))",
    border: "1.5px solid rgba(124,106,247,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    position: "relative",
  },
  orbInner: {
    animation: "spin 2s linear infinite",
  },
  ring1: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: "50%",
    border: "1px solid rgba(124,106,247,0.3)",
    animation: "ring 2s ease-out infinite",
  },
  ring2: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: "50%",
    border: "1px solid rgba(124,106,247,0.2)",
    animation: "ring 2s ease-out infinite 0.7s",
  },
  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "1.4rem",
    color: "#f0eff8",
    fontWeight: 400,
  },
  stage: {
    fontSize: "0.85rem",
    color: "#9896b0",
    minHeight: 20,
  },
  barTrack: {
    width: "100%",
    maxWidth: 320,
    height: 4,
    background: "rgba(255,255,255,0.06)",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
    backgroundSize: "200% auto",
    background: "linear-gradient(90deg, #5b4de0, #7c6af7, #a598ff, #7c6af7)",
    animation: "barShimmer 2s linear infinite",
    transition: "width 2.2s ease",
  },
  pct: {
    fontSize: "0.75rem",
    color: "#5c5a72",
    letterSpacing: "0.05em",
  },
  dots: {
    display: "flex",
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#7c6af7",
    display: "inline-block",
    animation: "bounce 0.9s ease-in-out infinite",
  },
};
