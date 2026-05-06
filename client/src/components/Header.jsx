/**
 * Header.jsx
 * Top navigation bar with branding and tagline.
 */

import React from "react";

export function Header() {
  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <div style={styles.brand}>
          {/* Logo mark */}
          <div style={styles.logoMark} aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="#7c6af7" fillOpacity="0.15" />
              <path
                d="M7 8h14M7 12h10M7 16h12M7 20h8"
                stroke="#7c6af7"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="21" cy="19" r="4" fill="#7c6af7" fillOpacity="0.3" />
              <path d="M19.5 19h3M21 17.5v3" stroke="#7c6af7" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 style={styles.title}>AI Contract Analyzer</h1>
            <p style={styles.subtitle}>Powered by Claude AI</p>
          </div>
        </div>
        <div style={styles.badge}>
          <span style={styles.dot} />
          Legal Risk Detection
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(9,9,15,0.95)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  inner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoMark: {
    flexShrink: 0,
  },
  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "1.15rem",
    fontWeight: 400,
    color: "#f0eff8",
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: "0.7rem",
    color: "#5c5a72",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    marginTop: 1,
  },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: "0.72rem",
    color: "#9896b0",
    background: "rgba(124,106,247,0.08)",
    border: "1px solid rgba(124,106,247,0.2)",
    borderRadius: 20,
    padding: "4px 12px",
    letterSpacing: "0.03em",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#7c6af7",
    display: "inline-block",
    animation: "pulse 2s infinite",
  },
};
