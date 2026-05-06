/**
 * pdfExport.js — RiskRadar Clean Report v3
 * White background, no emojis, single footer, strong typography.
 */

import jsPDF from "jspdf";
import "jspdf-autotable";

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  brand:    [74,  58, 210],
  brandLt:  [230, 226, 255],
  ink:      [18,  18,  32],
  muted:    [108, 106, 138],
  rule:     [218, 216, 232],
  white:    [255, 255, 255],
  pageBg:   [252, 251, 255],

  critical: { fg: [180, 16,  44],  bg: [255, 232, 236] },
  high:     { fg: [190, 42,  58],  bg: [255, 238, 240] },
  medium:   { fg: [160, 90,   8],  bg: [255, 246, 224] },
  low:      { fg: [14,  130, 90],  bg: [224, 248, 238] },
};

function riskStyle(level) {
  return C[(level || "").toLowerCase()] || { fg: C.muted, bg: [240, 240, 244] };
}

// ── Main export ───────────────────────────────────────────────────────────────
export function downloadAnalysisAsPDF(analysis, contractName = "Contract") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW  = doc.internal.pageSize.getWidth();   // 210
  const PH  = doc.internal.pageSize.getHeight();  // 297
  const ML  = 18;
  const MR  = 18;
  const CW  = PW - ML - MR;
  const BOT = PH - 16; // footer baseline

  const issues  = analysis.issues            || [];
  const chains  = analysis.combined_risks    || [];
  const sims    = analysis.abuse_simulations || [];
  const fixes   = analysis.top_fixes         || [];

  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  issues.forEach(i => { if (counts[i.risk_level] !== undefined) counts[i.risk_level]++; });

  // ── Low-level helpers ──────────────────────────────────────────────────────

  // Strip characters jsPDF can't render (keeps latin, numbers, punctuation)
  function clean(s) {
    return String(s || "").replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "");
  }

  function setFont(size, style, color) {
    doc.setFontSize(size);
    doc.setFont("helvetica", style || "normal");
    doc.setTextColor(...(color || C.ink));
  }

  function fillRect(x, y, w, h, color) {
    doc.setFillColor(...color);
    doc.rect(x, y, w, h, "F");
  }

  function hRule(y, color) {
    doc.setDrawColor(...(color || C.rule));
    doc.setLineWidth(0.25);
    doc.line(ML, y, PW - MR, y);
  }

  // Write wrapped text, return new Y
  function wrapText(raw, x, y, maxW, size, style, color, lineH) {
    const text = clean(raw);
    setFont(size, style, color);
    const lh    = lineH || size * 0.44;
    const lines = doc.splitTextToSize(text, maxW);
    lines.forEach(l => { doc.text(l, x, y); y += lh; });
    return y;
  }

  // Estimate height of wrapped text block
  function wrapH(raw, maxW, size, lineH) {
    const lines = doc.splitTextToSize(clean(raw || ""), maxW);
    return lines.length * (lineH || size * 0.44);
  }

  // ── Footer (called once per page at the END, never during content) ─────────
  // We draw all footers in a single pass at the very end.
  function applyFooters(total) {
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      // White strip so content doesn't bleed under footer
      fillRect(0, BOT - 4, PW, PH - BOT + 4, C.white);
      hRule(BOT - 4, C.rule);
      setFont(6.5, "normal", C.muted);
      doc.text(
        "RiskRadar  |  Informational purposes only. Not legal advice. Consult a qualified attorney.",
        ML, BOT
      );
      doc.text(`Page ${p} of ${total}`, PW - MR, BOT, { align: "right" });
    }
  }

  // ── Page management ────────────────────────────────────────────────────────
  // Safe content area: ML..PW-MR  x  top_margin..BOT-8
  function safeBotY() { return BOT - 10; }

  function needsNewPage(y, need) {
    return y + need > safeBotY();
  }

  function addPage() {
    doc.addPage();
    fillRect(0, 0, PW, PH, C.white);
    return ML; // return starting Y for content
  }

  function check(y, need) {
    if (needsNewPage(y, need)) return addPage();
    return y;
  }

  // ── Reusable section heading ───────────────────────────────────────────────
  function heading(y, label) {
    y = check(y, 16);
    fillRect(ML, y, 3, 9, C.brand);
    setFont(10.5, "bold", C.ink);
    doc.text(label, ML + 7, y + 7);
    hRule(y + 11, C.rule);
    return y + 17;
  }

  // ── Risk pill (inline) ─────────────────────────────────────────────────────
  function pill(x, y, level) {
    const { fg, bg } = riskStyle(level);
    const label = clean(level || "?");
    const pw    = 21;
    const ph    = 5.5;
    fillRect(x, y - 4.2, pw, ph, bg);
    setFont(6.5, "bold", fg);
    doc.text(label, x + pw / 2, y, { align: "center" });
    return x + pw + 3;
  }

  // ── Accent block (coloured left border + tinted bg) ────────────────────────
  function accentBlock(x, y, w, h, color, bgColor) {
    fillRect(x, y, w, h, bgColor);
    fillRect(x, y, 3, h, color);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ══════════════════════════════════════════════════════════════════════════
  fillRect(0, 0, PW, PH, C.white);

  // Top brand bar
  fillRect(0, 0, PW, 50, C.brand);

  // Brand name
  setFont(28, "bold", C.white);
  doc.text("RiskRadar", ML, 26);

  setFont(10, "normal", [200, 196, 255]);
  doc.text("Adversarial Contract Exploit Audit", ML, 36);

  // Overall risk on cover bar
  const rLabel = clean(analysis.overall_risk || "Unknown");
  const { fg: rfg } = riskStyle(rLabel);
  // White chip
  fillRect(PW - MR - 36, 10, 36, 12, C.white);
  setFont(7, "bold", rfg);
  doc.text("OVERALL RISK", PW - MR - 18, 17, { align: "center" });
  setFont(9, "bold", rfg);
  doc.text(rLabel.toUpperCase(), PW - MR - 18, 23, { align: "center" });

  let y = 62;

  // Meta card
  fillRect(ML, y, CW, 30, C.pageBg);
  doc.setDrawColor(...C.rule);
  doc.setLineWidth(0.3);
  doc.rect(ML, y, CW, 30);

  const metaLabels = ["DOCUMENT", "GENERATED", "TOTAL ISSUES"];
  const metaVals   = [
    contractName,
    new Date().toLocaleString(),
    String(issues.length),
  ];
  metaLabels.forEach((lbl, i) => {
    const my = y + 9 + i * 8;
    setFont(7, "bold", C.muted);
    doc.text(lbl, ML + 6, my);
    setFont(8, "normal", C.ink);
    doc.text(clean(metaVals[i]), ML + 50, my);
  });
  y += 36;

  // Risk count boxes
  const boxW = (CW - 9) / 4;
  ["Critical", "High", "Medium", "Low"].forEach((level, i) => {
    const bx          = ML + i * (boxW + 3);
    const { fg, bg }  = riskStyle(level);
    fillRect(bx, y, boxW, 26, bg);
    setFont(20, "bold", fg);
    doc.text(String(counts[level]), bx + boxW / 2, y + 16, { align: "center" });
    setFont(7, "normal", fg);
    doc.text(level, bx + boxW / 2, y + 23, { align: "center" });
  });
  y += 32;

  // Summary
  if (analysis.summary) {
    const sumText  = clean(analysis.summary);
    const sumLines = doc.splitTextToSize(sumText, CW - 14);
    const sumH     = sumLines.length * 4.6 + 16;
    fillRect(ML, y, CW, sumH, C.pageBg);
    fillRect(ML, y, 3, sumH, C.brand);
    setFont(7, "bold", C.brand);
    doc.text("ASSESSMENT SUMMARY", ML + 7, y + 7);
    setFont(8, "normal", C.ink);
    doc.text(sumLines, ML + 7, y + 13);
    y += sumH + 6;
  }

  // Stats line
  setFont(8, "normal", C.muted);
  doc.text(
    `${chains.length} exploit chain${chains.length !== 1 ? "s" : ""}   |   ` +
    `${sims.length} abuse scenario${sims.length !== 1 ? "s" : ""}   |   ` +
    `${fixes.length} priority fix${fixes.length !== 1 ? "es" : ""}`,
    ML, y + 6
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 2 — ISSUES TABLE
  // ══════════════════════════════════════════════════════════════════════════
  addPage();
  y = ML;
  y = heading(y, "Individual Findings");

  if (issues.length === 0) {
    setFont(9, "italic", C.muted);
    doc.text("No issues detected.", ML, y + 8);
    y += 16;
  } else {
    doc.autoTable({
      startY: y,
      head:   [["#", "Section", "Risk", "Issue", "Fix"]],
      body:   issues.map((iss, idx) => [
        idx + 1,
        clean(iss.section    || ""),
        clean(iss.risk_level || ""),
        clean(iss.issue      || ""),
        clean(iss.fix        || ""),
      ]),
      styles: {
        font: "helvetica", fontSize: 8,
        cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
        overflow: "linebreak",
        textColor: C.ink,
        lineColor: C.rule,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: C.brand,
        textColor: C.white,
        fontStyle: "bold",
        fontSize:  8,
      },
      alternateRowStyles: { fillColor: [249, 248, 255] },
      columnStyles: {
        0: { cellWidth: 8,  halign: "center" },
        1: { cellWidth: 28 },
        2: { cellWidth: 18, halign: "center" },
        3: { cellWidth: 62 },
        4: { cellWidth: 58 },
      },
      didParseCell(data) {
        if (data.column.index === 2 && data.section === "body") {
          const { fg, bg } = riskStyle(data.cell.raw);
          data.cell.styles.textColor = fg;
          data.cell.styles.fillColor = bg;
          data.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: ML, right: MR, top: ML, bottom: 22 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // REVISED CLAUSES (continues on same or new page)
  // ══════════════════════════════════════════════════════════════════════════
  const revised = issues.filter(i => i.revised_clause);
  if (revised.length > 0) {
    y = check(y, 24);
    y = heading(y, "Abuse-Resistant Revised Clauses");

    revised.forEach((iss, idx) => {
      const clauseText  = clean(iss.revised_clause);
      const clauseLines = doc.splitTextToSize(clauseText, CW - 14);
      const blockH      = clauseLines.length * 4.6 + 14;

      y = check(y, blockH + 14);

      // Label row
      setFont(8.5, "bold", C.ink);
      doc.text(`${idx + 1}.  ${clean(iss.section || "")}`, ML, y);
      pill(ML + doc.getTextWidth(`${idx + 1}.  ${clean(iss.section || "")}`) + 3, y, iss.risk_level);
      y += 6;

      // Clause box
      const { fg, bg } = riskStyle(iss.risk_level);
      accentBlock(ML, y, CW, blockH, fg, bg);
      setFont(8, "normal", C.ink);
      doc.text(clauseLines, ML + 8, y + 7);
      y += blockH + 8;
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXPLOIT CHAINS
  // ══════════════════════════════════════════════════════════════════════════
  if (chains.length > 0) {
    y = addPage();
    y = heading(y, "Multi-Clause Exploit Chains");

    chains.forEach((cr, ci) => {
      const steps    = cr.exploit_chain || [];
      const emergent = clean(cr.what_combination_creates || "");
      const impact   = clean(cr.impact || "");
      const sev      = cr.severity || "High";
      const { fg: sfg, bg: sbg } = riskStyle(sev);

      // Estimate block height
      const estH = 14
        + (emergent ? wrapH(emergent, CW - 12, 8) + 12 : 0)
        + steps.length * 16
        + (impact ? wrapH(impact, CW - 12, 8) + 12 : 0)
        + 10;

      y = check(y, estH);

      // Chain header bar
      fillRect(ML, y, CW, 11, sfg);
      setFont(8.5, "bold", C.white);
      const clauseStr = (cr.clauses_involved || []).map(clean).join("  +  ");
      doc.text(`Chain ${ci + 1}  |  ${clauseStr}`, ML + 5, y + 7.5);
      doc.text(sev.toUpperCase(), PW - MR - 4, y + 7.5, { align: "right" });
      y += 14;

      // Emergent risk
      if (emergent) {
        const eLines = doc.splitTextToSize(emergent, CW - 12);
        const eH     = eLines.length * 4.6 + 10;
        fillRect(ML, y, CW, eH, [244, 242, 255]);
        setFont(7, "bold", C.brand);
        doc.text("EMERGENT RISK", ML + 5, y + 6);
        setFont(7.5, "italic", C.muted);
        doc.text(eLines, ML + 5, y + 11);
        y += eH + 4;
      }

      // Steps
      steps.forEach((step, si) => {
        y = check(y, 14);
        const sLines = doc.splitTextToSize(clean(step), CW - 16);
        const sH     = sLines.length * 4.6 + 6;
        // Circle badge
        doc.setFillColor(...C.brand);
        doc.circle(ML + 5, y + 4, 3.5, "F");
        setFont(7, "bold", C.white);
        doc.text(String(si + 1), ML + 5, y + 5.8, { align: "center" });
        setFont(7.5, "normal", C.ink);
        doc.text(sLines, ML + 12, y + 5);
        y += sH + 3;
      });

      // Impact
      if (impact) {
        const iLines = doc.splitTextToSize(impact, CW - 12);
        const iH     = iLines.length * 4.6 + 10;
        y = check(y, iH + 4);
        accentBlock(ML, y, CW, iH, C.critical.fg, C.critical.bg);
        setFont(7, "bold", C.critical.fg);
        doc.text("IMPACT", ML + 6, y + 6);
        setFont(7.5, "normal", C.ink);
        doc.text(iLines, ML + 6, y + 11);
        y += iH + 6;
      }

      hRule(y, C.rule);
      y += 6;
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ABUSE SIMULATIONS
  // ══════════════════════════════════════════════════════════════════════════
  if (sims.length > 0) {
    y = addPage();
    y = heading(y, "Abuse Simulations");

    const SIM_FG = {
      PAYMENT_LOSS:        C.medium.fg,
      ACCEPTANCE_TRAP:     C.high.fg,
      OWNERSHIP_BLOCK:     C.critical.fg,
      TERMINATION_EXPLOIT: C.brand,
    };

    sims.forEach((sim, si) => {
      const steps  = sim.steps || [];
      const typeC  = SIM_FG[sim.scenario_type] || C.brand;
      const estH   = 20 + steps.length * 14 + 20;

      y = check(y, estH);

      // Scenario header
      fillRect(ML, y, CW, 11, C.pageBg);
      fillRect(ML, y, 4, 11, typeC);
      setFont(9, "bold", C.ink);
      doc.text(
        `Scenario ${si + 1}: ${clean(sim.title || sim.scenario_type || "Exploit")}`,
        ML + 8, y + 8
      );
      y += 14;

      // Clauses
      if ((sim.clauses_exploited || []).length > 0) {
        setFont(7, "normal", C.muted);
        doc.text(`Clauses: ${sim.clauses_exploited.map(clean).join(", ")}`, ML + 2, y);
        y += 6;
      }

      // Steps
      steps.forEach((step, i) => {
        y = check(y, 13);
        const sLines = doc.splitTextToSize(clean(step), CW - 16);
        const sH     = sLines.length * 4.6 + 5;
        doc.setFillColor(...typeC);
        doc.circle(ML + 5, y + 4, 3.5, "F");
        setFont(7, "bold", C.white);
        doc.text(String(i + 1), ML + 5, y + 5.8, { align: "center" });
        setFont(7.5, "normal", C.ink);
        doc.text(sLines, ML + 12, y + 5);
        y += sH + 3;
      });

      // Financial / Legal impact row
      if (sim.financial_impact || sim.legal_impact) {
        y = check(y, 18);
        const halfW = (CW - 3) / 2;

        if (sim.financial_impact) {
          const fLines = doc.splitTextToSize(clean(sim.financial_impact), halfW - 8);
          const fH     = Math.max(fLines.length * 4.2 + 12, 18);
          accentBlock(ML, y, halfW, fH, C.medium.fg, C.medium.bg);
          setFont(6.5, "bold", C.medium.fg);
          doc.text("FINANCIAL", ML + 6, y + 6);
          setFont(7.5, "normal", C.ink);
          doc.text(fLines, ML + 6, y + 12);
        }

        if (sim.legal_impact) {
          const lx     = ML + halfW + 3;
          const lLines = doc.splitTextToSize(clean(sim.legal_impact), halfW - 8);
          const lH     = Math.max(lLines.length * 4.2 + 12, 18);
          accentBlock(lx, y, halfW, lH, C.brand, C.brandLt);
          setFont(6.5, "bold", C.brand);
          doc.text("LEGAL", lx + 6, y + 6);
          setFont(7.5, "normal", C.ink);
          doc.text(lLines, lx + 6, y + 12);
        }

        y += 22;
      }

      hRule(y, C.rule);
      y += 6;
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TOP PRIORITY FIXES
  // ══════════════════════════════════════════════════════════════════════════
  if (fixes.length > 0) {
    y = check(y, 40);
    y = heading(y, "Top Priority Fixes");

    fixes.forEach(fix => {
      const urgLines = doc.splitTextToSize(clean(fix.why_urgent || ""), CW - 14);
      const actLines = doc.splitTextToSize(clean(fix.action    || ""), CW - 14);
      const blockH   = urgLines.length * 4.6 + actLines.length * 4.6 + 30;

      y = check(y, blockH);

      // Rank badge
      doc.setFillColor(...C.brand);
      doc.circle(ML + 5.5, y + 5.5, 5.5, "F");
      setFont(9, "bold", C.white);
      doc.text(String(fix.rank), ML + 5.5, y + 7.5, { align: "center" });

      // Title
      setFont(10, "bold", C.ink);
      doc.text(clean(fix.issue || ""), ML + 15, y + 7);
      y += 14;

      // Why urgent block
      if (fix.why_urgent) {
        const wH = urgLines.length * 4.6 + 9;
        accentBlock(ML, y, CW, wH, C.high.fg, C.high.bg);
        setFont(7.5, "normal", C.ink);
        doc.text(urgLines, ML + 7, y + 7);
        y += wH + 4;
      }

      // Action block
      if (fix.action) {
        const aH = actLines.length * 4.6 + 9;
        accentBlock(ML, y, CW, aH, C.brand, C.brandLt);
        setFont(7.5, "normal", C.ink);
        doc.text(actLines, ML + 7, y + 7);
        y += aH + 6;
      }

      hRule(y, C.rule);
      y += 6;
    });
  }

  // ── Single-pass footer on every page ──────────────────────────────────────
  applyFooters(doc.getNumberOfPages());

  doc.save(`riskradar-audit-${Date.now()}.pdf`);
}
