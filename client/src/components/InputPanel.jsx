/**
 * InputPanel.jsx
 * Left panel — handles both text paste and file upload tabs.
 */

import React, { useRef, useState } from "react";

export function InputPanel({
  activeTab,
  setActiveTab,
  contractText,
  setContractText,
  uploadedFile,
  handleFileSelect,
  onAnalyze,
  onLoadSample,
  loading,
  error,
}) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  // ── Drag & Drop ──────────────────────────────────────────────────────────
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const canAnalyze =
    !loading &&
    (activeTab === "paste" ? contractText.trim().length > 30 : !!uploadedFile);

  return (
    <div style={styles.panel}>
      {/* ── Tab switcher ── */}
      <div style={styles.tabs}>
        {["paste", "upload"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
          >
            {tab === "paste" ? (
              <><PasteIcon /> Paste Text</>
            ) : (
              <><UploadIcon /> Upload File</>
            )}
          </button>
        ))}
      </div>

      {/* ── Paste Tab ── */}
      {activeTab === "paste" && (
        <div style={styles.tabContent}>
          <div style={styles.textareaWrapper}>
            <textarea
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              placeholder="Paste your contract text here…&#10;&#10;The AI will detect:&#10;• Vague or ambiguous clauses&#10;• Missing critical provisions&#10;• One-sided or unfair terms&#10;• Risky indemnity & payment clauses&#10;• Inconsistencies between sections"
              style={styles.textarea}
              spellCheck={false}
            />
            {contractText && (
              <div style={styles.charCount}>
                {contractText.length.toLocaleString()} characters
              </div>
            )}
          </div>
          <button
            style={styles.sampleBtn}
            onClick={onLoadSample}
            disabled={loading}
          >
            <SampleIcon /> Load Sample Contract
          </button>
        </div>
      )}

      {/* ── Upload Tab ── */}
      {activeTab === "upload" && (
        <div style={styles.tabContent}>
          <div
            style={{
              ...styles.dropZone,
              ...(dragOver ? styles.dropZoneActive : {}),
              ...(uploadedFile ? styles.dropZoneSuccess : {}),
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            aria-label="Upload contract file"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              style={{ display: "none" }}
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
            {uploadedFile ? (
              <div style={styles.fileInfo}>
                <FileCheckIcon />
                <div>
                  <div style={styles.fileName}>{uploadedFile.name}</div>
                  <div style={styles.fileSize}>
                    {(uploadedFile.size / 1024).toFixed(1)} KB — Ready to analyze
                  </div>
                </div>
                <button
                  style={styles.clearFile}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileSelect(null);
                    fileInputRef.current.value = "";
                  }}
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div style={styles.dropIcon}><BigUploadIcon /></div>
                <div style={styles.dropTitle}>
                  {dragOver ? "Drop it here!" : "Drop your contract here"}
                </div>
                <div style={styles.dropSub}>or click to browse</div>
                <div style={styles.dropTypes}>PDF · DOCX · TXT — max 10 MB</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Error message ── */}
      {error && (
        <div style={styles.error} role="alert">
          <ErrorIcon />
          <span>{error}</span>
        </div>
      )}

      {/* ── Analyze button ── */}
      <button
        style={{
          ...styles.analyzeBtn,
          ...(!canAnalyze ? styles.analyzeBtnDisabled : {}),
        }}
        onClick={onAnalyze}
        disabled={!canAnalyze}
      >
        {loading ? (
          <><Spinner /> Analyzing…</>
        ) : (
          <><AnalyzeIcon /> Analyze Contract</>
        )}
      </button>

      {/* ── Disclaimer ── */}
      <p style={styles.disclaimer}>
        🔒 Documents are processed in-memory only and never stored.
        This tool provides AI-generated analysis, not legal advice.
      </p>
    </div>
  );
}

// ─── Inline SVG Icons ────────────────────────────────────────────────────────
const PasteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);
const UploadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const BigUploadIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const FileCheckIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <polyline points="9 15 11 17 15 13" />
  </svg>
);
const SampleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const AnalyzeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);
const ErrorIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const Spinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: 8, animation: "spin 0.8s linear infinite" }}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    height: "100%",
  },
  tabs: {
    display: "flex",
    gap: 4,
    background: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "#9896b0",
    fontSize: "0.82rem",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    transition: "all 0.18s ease",
    fontWeight: 500,
  },
  tabActive: {
    background: "#1e1e30",
    color: "#f0eff8",
    boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
  },
  tabContent: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    flex: 1,
  },
  textareaWrapper: {
    position: "relative",
    flex: 1,
  },
  textarea: {
    width: "100%",
    minHeight: 340,
    background: "#0e0e1a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    color: "#d4d2e8",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.85rem",
    lineHeight: 1.7,
    padding: "16px",
    resize: "vertical",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  charCount: {
    position: "absolute",
    bottom: 10,
    right: 12,
    fontSize: "0.68rem",
    color: "#5c5a72",
    pointerEvents: "none",
  },
  sampleBtn: {
    display: "flex",
    alignItems: "center",
    alignSelf: "flex-start",
    background: "transparent",
    border: "1px solid rgba(124,106,247,0.25)",
    color: "#7c6af7",
    borderRadius: 8,
    padding: "7px 14px",
    fontSize: "0.8rem",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    transition: "all 0.18s ease",
  },
  dropZone: {
    border: "2px dashed rgba(255,255,255,0.1)",
    borderRadius: 14,
    background: "#0e0e1a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    minHeight: 280,
    gap: 8,
    textAlign: "center",
  },
  dropZoneActive: {
    borderColor: "#7c6af7",
    background: "rgba(124,106,247,0.06)",
  },
  dropZoneSuccess: {
    borderColor: "rgba(62,207,142,0.4)",
    background: "rgba(62,207,142,0.04)",
    flexDirection: "row",
    justifyContent: "flex-start",
    padding: "20px 24px",
    gap: 16,
    minHeight: "auto",
    textAlign: "left",
  },
  dropIcon: {
    color: "#5c5a72",
    marginBottom: 4,
  },
  dropTitle: {
    color: "#d4d2e8",
    fontSize: "0.95rem",
    fontWeight: 500,
  },
  dropSub: {
    color: "#5c5a72",
    fontSize: "0.82rem",
  },
  dropTypes: {
    marginTop: 6,
    fontSize: "0.72rem",
    color: "#5c5a72",
    letterSpacing: "0.04em",
  },
  fileInfo: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
  },
  fileName: {
    color: "#f0eff8",
    fontSize: "0.9rem",
    fontWeight: 500,
    wordBreak: "break-all",
  },
  fileSize: {
    color: "#3ecf8e",
    fontSize: "0.75rem",
    marginTop: 2,
  },
  clearFile: {
    marginLeft: "auto",
    background: "transparent",
    border: "none",
    color: "#5c5a72",
    cursor: "pointer",
    fontSize: "1rem",
    padding: "4px 8px",
    borderRadius: 6,
    flexShrink: 0,
  },
  error: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    background: "rgba(255,77,109,0.1)",
    border: "1px solid rgba(255,77,109,0.3)",
    borderRadius: 10,
    padding: "12px 14px",
    color: "#ff4d6d",
    fontSize: "0.83rem",
    lineHeight: 1.5,
  },
  analyzeBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #7c6af7 0%, #5b4de0 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px 24px",
    fontSize: "0.95rem",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 20px rgba(124,106,247,0.35)",
    letterSpacing: "0.01em",
  },
  analyzeBtnDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  disclaimer: {
    fontSize: "0.72rem",
    color: "#5c5a72",
    lineHeight: 1.6,
    textAlign: "center",
  },
};
