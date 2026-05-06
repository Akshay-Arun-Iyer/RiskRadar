/**
 * pdfExport.js
 * Clean, professional white-background PDF audit report.
 * No emojis, no dark backgrounds, proper typography hierarchy.
 */

import jsPDF from "jspdf";
import "jspdf-autotable";

const BRAND   = [89, 74, 226];   // #5b4ae2 purple
const INK     = [22, 22, 38];    // near-black
const MUTED   = [110, 108, 140]; // grey
const RULE    = [220, 218, 235]; // light divider

const RISK_COLOR = {
  Critical: [200, 20,  50],
  High:     [210, 50,  70],
  Medium:   [180, 100, 10],
  Low:      [20,  140, 100],
};

const RISK_BG = {
  Critical: [255, 235, 238],
  High:     [255, 240, 242],
  Medium:   [255, 248, 230],
  Low:      [230, 248, 240],
};

export function downloadAnalysisAsPDF(analysis, contractName = "Contract") {
  const doc      = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW       = doc.internal.pageSize.getWidth();
  const PH       = doc.internal.pageSize.getHeight();
  const ML       = 20;   // margin left
  const MR       = 20;   // margin right
  const CW       = PW - ML - MR;
  const FOOTER_H = 14;

  const issues  = analysis.issues || [];
  const chains  = analysis.combined_risks || [];
  const sims    = analysis.abuse_simulations || [];
  const fixes   = analysis.top_fixes || [];
  const counts  = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  issues.forEach(i => { if (counts[i.risk_level] !== undefined) counts[i.risk_level]++; });

  // ── Helpers ────────────────────────────────────────────────────────────────

  function newPage() {
    doc.addPage();
    // White background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, PW, PH, "F");
    drawFooter();
    return ML;
  }

  function check(y, need) {
    if (y + need > PH - FOOTER_H - 6) return newPage();
    return y;
  }

  function txt(text, x, y, maxW, size, color, style = "normal", lh = null) {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(...color);
    const lineH = lh || size * 0.45;
    const lines = doc.splitTextToSize(String(text || ""), maxW);
    lines.forEach(line => { doc.text(line, x, y); y += lineH; });
    return y;
  }

  function rule(y, color = RULE) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(ML, y, PW - MR, y);
    return y + 4;
  }

  function sectionHeading(y, label) {
    y = check(y, 14);
    doc.setFillColor(...BRAND);
    doc.rect(ML, y, 3, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(label.toUpperCase(), ML + 6, y + 6);
    return y + 12;
  }

  function riskPill(x, y, level) {
    const [r, g, b]   = RISK_COLOR[level] || MUTED;
    const [br,bg,bb]  = RISK_BG[level]    || [240,240,240];
    const label        = level || "Unknown";
    const w            = 22;
    const h            = 5.5;
    doc.setFillColor(br, bg, bb);
    doc.roundedRect(x, y - 4, w, h, 1.5, 1.5, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(r, g, b);
    doc.text(label, x + w / 2, y, { align: "center" });
    return x + w + 3;
  }

  function drawFooter() {
    const p = doc.getNumberOfPages();
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.line(ML, PH - FOOTER_H, PW - MR, PH - FOOTER_H);
    doc.text("RiskRadar  |  For informational purposes only. Not legal advice.", ML, PH - 8);
    doc.text(`Page ${p}`, PW - MR, PH - 8, { align: "right" });
  }

  // ── Cover page ─────────────────────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, PW, PH, "F");

  // Purple accent bar
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, PW, 52, "F");

  // Logo text
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("RiskRadar", ML, 28);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 196, 255);
  doc.text("Adversarial Contract Exploit Audit", ML, 38);

  // Overall risk badge on cover
  const riskLabel = analysis.overall_risk || "Unknown";
  const [rr, rg, rb] = RISK_COLOR[riskLabel] || MUTED;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(rr, rg, rb);
  doc.text(`OVERALL RISK: ${riskLabel.toUpperCase()}`, PW - MR, 28, { align: "right" });

  let y = 72;

  // Document meta block
  doc.setFillColor(247, 246, 252);
  doc.roundedRect(ML, y, CW, 32, 3, 3, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text("DOCUMENT",     ML + 8, y + 10);
  doc.text("GENERATED",    ML + 8, y + 18);
  doc.text("TOTAL ISSUES", ML + 8, y + 26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text(contractName,                  ML + 52, y + 10);
  doc.text(new Date().toLocaleString(),   ML + 52, y + 18);
  doc.text(String(issues.length),         ML + 52, y + 26);
  y += 40;

  // Risk breakdown boxes on cover
  const boxW = CW / 4 - 3;
  ["Critical","High","Medium","Low"].forEach((level, i) => {
    const bx = ML + i * (boxW + 4);
    const [cr, cg, cb]  = RISK_COLOR[level];
    const [br, bg2, bb] = RISK_BG[level];
    doc.setFillColor(br, bg2, bb);
    doc.roundedRect(bx, y, boxW, 24, 3, 3, "F");
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(cr, cg, cb);
    doc.text(String(counts[level]), bx + boxW / 2, y + 14, { align: "center" });
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(level, bx + boxW / 2, y + 21, { align: "center" });
  });
  y += 34;

  // Summary box on cover
  if (analysis.summary) {
    doc.setFillColor(247, 246, 252);
    doc.roundedRect(ML, y, CW, 4, 2, 2, "F");
    const sumLines = doc.splitTextToSize(analysis.summary, CW - 16);
    const sumH = sumLines.length * 5.2 + 14;
    doc.setFillColor(247, 246, 252);
    doc.roundedRect(ML, y, CW, sumH, 3, 3, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND);
    doc.text("ASSESSMENT SUMMARY", ML + 8, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
    doc.text(sumLines, ML + 8, y + 15);
    y += sumH + 6;
  }

  // Chain + scenario count on cover
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(`${chains.length} exploit chain${chains.length !== 1 ? "s" : ""} detected   |   ${sims.length} abuse scenario${sims.length !== 1 ? "s" : ""} simulated   |   ${fixes.length} priority fix${fixes.length !== 1 ? "es" : ""} recommended`, ML, y + 8);

  drawFooter();

  // ── Page 2+: Issues table ──────────────────────────────────────────────────
  newPage();
  y = ML;
  y = sectionHeading(y, "Individual Findings");

  doc.autoTable({
    startY: y,
    head: [["#", "Section", "Risk", "Issue", "Fix"]],
    body: issues.map((issue, idx) => [
      idx + 1,
      issue.section    || "—",
      issue.risk_level || "—",
      issue.issue      || "—",
      issue.fix        || "—",
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
      overflow: "linebreak",
      textColor: INK,
      lineColor: RULE,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [89, 74, 226],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [250, 249, 255],
    },
    columnStyles: {
      0: { cellWidth: 8,  halign: "center" },
      1: { cellWidth: 30 },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 60 },
      4: { cellWidth: 58 },
    },
    didParseCell(data) {
      if (data.column.index === 2 && data.section === "body") {
        const level = data.cell.raw;
        const [r, g, b]    = RISK_COLOR[level] || MUTED;
        const [br, bg2, bb] = RISK_BG[level]   || [240, 240, 240];
        data.cell.styles.textColor   = [r, g, b];
        data.cell.styles.fillColor   = [br, bg2, bb];
        data.cell.styles.fontStyle   = "bold";
      }
    },
    margin: { left: ML, right: MR, top: ML, bottom: FOOTER_H + 6 },
  });

  y = doc.lastAutoTable.finalY + 10;

  // ── Revised clauses (inline after table) ──────────────────────────────────
  const withRevisions = issues.filter(i => i.revised_clause);
  if (withRevisions.length > 0) {
    y = check(y, 20);
    y = sectionHeading(y, "Abuse-Resistant Revised Clauses");

    withRevisions.forEach((issue, idx) => {
      const lines  = doc.splitTextToSize(issue.revised_clause || "", CW - 16);
      const blockH = lines.length * 4.8 + 18;
      y = check(y, blockH + 6);

      // Section label
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...INK);
      doc.text(`${idx + 1}. ${issue.section || ""}`, ML, y);
      riskPill(ML + doc.getTextWidth(`${idx + 1}. ${issue.section || ""}`) + 4, y, issue.risk_level);
      y += 6;

      // Clause box with left accent
      const [cr, cg, cb] = RISK_COLOR[issue.risk_level] || MUTED;
      doc.setFillColor(247, 246, 252);
      doc.rect(ML, y, CW, blockH - 4, "F");
      doc.setFillColor(cr, cg, cb);
      doc.rect(ML, y, 3, blockH - 4, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...INK);
      doc.text(lines, ML + 8, y + 7);
      y += blockH + 4;
    });
  }

  // ── Exploit Chains ─────────────────────────────────────────────────────────
  if (chains.length > 0) {
    y = newPage();
    y = sectionHeading(y, "Multi-Clause Exploit Chains");

    chains.forEach((cr, ci) => {
      const stepLines  = (cr.exploit_chain || []);
      const impactLine = cr.impact || "";
      const emergent   = cr.what_combination_creates || "";
      const estH       = 22 + stepLines.length * 12 + (emergent ? 10 : 0) + (impactLine ? 8 : 0);
      y = check(y, estH);

      const sev = cr.severity || "High";
      const [sr, sg, sb] = RISK_COLOR[sev] || RISK_COLOR.High;

      // Chain header
      doc.setFillColor(sr, sg, sb);
      doc.rect(ML, y, CW, 10, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(
        `Chain ${ci + 1}  |  ${(cr.clauses_involved || []).join("  +  ")}`,
        ML + 5, y + 7
      );
      doc.text(sev.toUpperCase(), PW - MR - 4, y + 7, { align: "right" });
      y += 13;

      // Emergent risk
      if (emergent) {
        doc.setFillColor(247, 246, 252);
        const eLines = doc.splitTextToSize(`Emergent risk: ${emergent}`, CW - 12);
        const eH     = eLines.length * 4.8 + 8;
        doc.rect(ML, y, CW, eH, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...MUTED);
        doc.text(eLines, ML + 6, y + 6);
        y += eH + 3;
      }

      // Steps
      stepLines.forEach((step, si) => {
        y = check(y, 12);
        const sLines = doc.splitTextToSize(step, CW - 16);
        const sH     = sLines.length * 4.8 + 6;

        // Step number circle
        doc.setFillColor(...BRAND);
        doc.circle(ML + 5, y + 4, 3.5, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(String(si + 1), ML + 5, y + 5.5, { align: "center" });

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...INK);
        doc.text(sLines, ML + 12, y + 5);
        y += sH + 2;
      });

      // Impact
      if (impactLine) {
        y = check(y, 10);
        const iLines = doc.splitTextToSize(`Impact: ${impactLine}`, CW - 12);
        const iH     = iLines.length * 4.8 + 8;
        doc.setFillColor(255, 240, 242);
        doc.rect(ML, y, CW, iH, "F");
        doc.setFillColor(...RISK_COLOR.High);
        doc.rect(ML, y, 3, iH, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...RISK_COLOR.High);
        doc.text(iLines, ML + 7, y + 6);
        y += iH + 6;
      }

      y = rule(y);
    });
  }

  // ── Abuse Scenarios ────────────────────────────────────────────────────────
  if (sims.length > 0) {
    y = newPage();
    y = sectionHeading(y, "Abuse Simulations");

    const SIM_COLORS = {
      PAYMENT_LOSS:        [180, 100, 10],
      ACCEPTANCE_TRAP:     [210, 50,  70],
      OWNERSHIP_BLOCK:     [200, 20,  50],
      TERMINATION_EXPLOIT: [89,  74, 226],
    };

    sims.forEach((sim, si) => {
      const estH = 18 + (sim.steps || []).length * 12 + 16;
      y = check(y, estH);

      const typeColor = SIM_COLORS[sim.scenario_type] || BRAND;
      const [tr, tg, tb] = typeColor;

      // Scenario header
      doc.setFillColor(247, 246, 252);
      doc.rect(ML, y, CW, 10, "F");
      doc.setFillColor(tr, tg, tb);
      doc.rect(ML, y, 4, 10, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...INK);
      doc.text(
        `Scenario ${si + 1}: ${sim.title || sim.scenario_type || "Exploit"}`,
        ML + 8, y + 7
      );
      y += 13;

      // Clauses exploited
      if ((sim.clauses_exploited || []).length > 0) {
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...MUTED);
        doc.text(`Clauses: ${sim.clauses_exploited.join(", ")}`, ML + 2, y);
        y += 6;
      }

      // Steps
      (sim.steps || []).forEach((step, i) => {
        y = check(y, 12);
        const sLines = doc.splitTextToSize(step, CW - 16);
        const sH     = sLines.length * 4.8 + 6;
        doc.setFillColor(tr, tg, tb);
        doc.circle(ML + 5, y + 4, 3.5, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(String(i + 1), ML + 5, y + 5.5, { align: "center" });
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...INK);
        doc.text(sLines, ML + 12, y + 5);
        y += sH + 2;
      });

      // Impact row
      if (sim.financial_impact || sim.legal_impact) {
        y = check(y, 14);
        const colW2 = (CW - 4) / 2;

        if (sim.financial_impact) {
          doc.setFillColor(255, 248, 230);
          doc.rect(ML, y, colW2, 12, "F");
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(180, 100, 10);
          doc.text("FINANCIAL", ML + 4, y + 5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...INK);
          const fL = doc.splitTextToSize(sim.financial_impact, colW2 - 8);
          doc.setFontSize(7.5);
          doc.text(fL[0] || "", ML + 4, y + 10);
        }
        if (sim.legal_impact) {
          const lx = ML + colW2 + 4;
          doc.setFillColor(240, 238, 255);
          doc.rect(lx, y, colW2, 12, "F");
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...BRAND);
          doc.text("LEGAL", lx + 4, y + 5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...INK);
          const lL = doc.splitTextToSize(sim.legal_impact, colW2 - 8);
          doc.setFontSize(7.5);
          doc.text(lL[0] || "", lx + 4, y + 10);
        }
        y += 16;
      }

      y = rule(y);
    });
  }

  // ── Top Priority Fixes ─────────────────────────────────────────────────────
  if (fixes.length > 0) {
    y = check(y, 40);
    y = sectionHeading(y, "Top Priority Fixes");

    fixes.forEach(fix => {
      const urgLines   = doc.splitTextToSize(fix.why_urgent || "", CW - 20);
      const actLines   = doc.splitTextToSize(fix.action    || "", CW - 20);
      const blockH     = urgLines.length * 4.8 + actLines.length * 4.8 + 22;
      y = check(y, blockH);

      // Rank badge
      doc.setFillColor(...BRAND);
      doc.circle(ML + 5, y + 5, 5, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(`${fix.rank}`, ML + 5, y + 7, { align: "center" });

      // Fix title
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...INK);
      doc.text(fix.issue || "", ML + 14, y + 7);
      y += 14;

      // Why urgent
      if (fix.why_urgent) {
        doc.setFillColor(255, 240, 242);
        const wH = urgLines.length * 4.8 + 7;
        doc.rect(ML, y, CW, wH, "F");
        doc.setFillColor(...RISK_COLOR.High);
        doc.rect(ML, y, 3, wH, "F");
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...INK);
        doc.text(urgLines, ML + 7, y + 5);
        y += wH + 3;
      }

      // Action
      if (fix.action) {
        doc.setFillColor(240, 238, 255);
        const aH = actLines.length * 4.8 + 7;
        doc.rect(ML, y, CW, aH, "F");
        doc.setFillColor(...BRAND);
        doc.rect(ML, y, 3, aH, "F");
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...INK);
        doc.text(actLines, ML + 7, y + 5);
        y += aH + 6;
      }

      y = rule(y);
    });
  }

  // ── Update all footers ─────────────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.line(ML, PH - FOOTER_H, PW - MR, PH - FOOTER_H);
    doc.text(
      "RiskRadar  |  For informational purposes only. Not legal advice. Consult a qualified attorney.",
      ML, PH - 8
    );
    doc.text(`Page ${i} of ${total}`, PW - MR, PH - 8, { align: "right" });
  }

  doc.save(`riskradar-audit-${Date.now()}.pdf`);
}
