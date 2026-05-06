/**
 * pdfExport.js
 * Generates a downloadable multi-page PDF audit report.
 * Fixed field names to match API schema: section / issue / fix / revised_clause
 */

import jsPDF from "jspdf";
import "jspdf-autotable";

export function downloadAnalysisAsPDF(analysis, contractName = "Contract") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin     = 18;
  const contentW   = pageWidth - margin * 2;

  const riskColors = {
    Critical: [220, 20,  60],
    High:     [220, 38,  60],
    Medium:   [217, 119, 6],
    Low:      [16,  163, 127],
  };

  function ensurePage(y, need = 20) {
    if (y + need > pageHeight - 14) { doc.addPage(); return margin; }
    return y;
  }

  function addText(text, x, y, maxW, size, color, style = "normal", lineH = 5.2) {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(text || ""), maxW);
    lines.forEach(line => { doc.text(line, x, y); y += lineH; });
    return y;
  }

  let y = margin;

  // ── Page 1: Dark header ────────────────────────────────────────────────────
  doc.setFillColor(9, 9, 15);
  doc.rect(0, 0, pageWidth, 44, "F");

  doc.setTextColor(240, 239, 248);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("RiskRadar — Contract Exploit Audit", margin, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(152, 150, 176);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 26);
  doc.text(`Document: ${contractName}`, margin, 32);
  doc.text(`Overall Risk: ${analysis.overall_risk || "Unknown"}`, margin, 38);

  y = 54;

  // ── Risk count summary boxes ───────────────────────────────────────────────
  const issues = analysis.issues || [];
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  issues.forEach(i => { if (counts[i.risk_level] !== undefined) counts[i.risk_level]++; });

  doc.setFillColor(19, 19, 31);
  doc.roundedRect(margin, y, contentW, 28, 3, 3, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(152, 150, 176);
  doc.text("ISSUE BREAKDOWN", margin + 6, y + 7);

  const levels = ["Critical", "High", "Medium", "Low"];
  const colW = contentW / 4;
  levels.forEach((level, i) => {
    const cx = margin + 6 + i * colW;
    const [r, g, b] = riskColors[level] || [150, 150, 150];
    doc.setTextColor(r, g, b);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(String(counts[level]), cx, y + 20);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(152, 150, 176);
    doc.text(level, cx, y + 26);
  });
  y += 36;

  // ── Summary ────────────────────────────────────────────────────────────────
  if (analysis.summary) {
    y = addText(analysis.summary, margin, y, contentW, 9, [100, 98, 120], "italic");
    y += 6;
  }

  // ── Issues table (fixed field names: section, issue, risk_level, fix) ──────
  if (issues.length === 0) {
    y = addText("✓ No significant issues found.", margin, y, contentW, 11, [62, 207, 142]);
  } else {
    doc.autoTable({
      startY: y,
      head: [["#", "Section", "Risk", "Issue", "Fix"]],
      body: issues.map((issue, idx) => [
        idx + 1,
        issue.section  || "—",   // ← was issue.clause  (wrong)
        issue.risk_level || "—",
        issue.issue    || "—",   // ← was issue.problem (wrong)
        issue.fix      || "—",   // ← was issue.suggestion (wrong)
      ]),
      styles: {
        font: "helvetica", fontSize: 7.5, cellPadding: 3,
        overflow: "linebreak", textColor: [60, 58, 80],
      },
      headStyles: {
        fillColor: [19, 19, 31], textColor: [152, 150, 176],
        fontStyle: "bold", fontSize: 7.5,
      },
      columnStyles: {
        0: { cellWidth: 7 },
        1: { cellWidth: 32 },
        2: { cellWidth: 16 },
        3: { cellWidth: 62 },
        4: { cellWidth: 57 },
      },
      didParseCell(data) {
        if (data.column.index === 2 && data.section === "body") {
          const [r, g, b] = riskColors[data.cell.raw] || [150, 150, 150];
          data.cell.styles.textColor = [r, g, b];
          data.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── Exploit chains page ────────────────────────────────────────────────────
  const chains = analysis.combined_risks || [];
  if (chains.length > 0) {
    doc.addPage();
    y = margin;
    y = addText("Multi-Clause Exploit Chains", margin, y, contentW, 14, [240, 239, 248], "bold");
    y += 4;

    chains.forEach((cr, ci) => {
      y = ensurePage(y, 40);
      const [r, g, b] = cr.severity === "Critical" ? riskColors.Critical : riskColors.High;

      doc.setFillColor(19, 19, 31);
      doc.rect(margin, y - 4, contentW, 10, "F");
      doc.setTextColor(r, g, b);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(
        `Chain ${ci + 1}: ${(cr.clauses_involved || []).join(" + ")}  [${cr.severity || "High"}]`,
        margin + 3, y + 3
      );
      y += 12;

      if (cr.what_combination_creates) {
        y = addText(`Emergent Risk: ${cr.what_combination_creates}`, margin + 3, y, contentW - 6, 8, [160, 154, 200], "italic");
        y += 2;
      }

      (cr.exploit_chain || []).forEach((step, si) => {
        y = ensurePage(y, 10);
        y = addText(`  ${si + 1}. ${step}`, margin + 6, y, contentW - 10, 7.5, [180, 178, 200]);
      });

      if (cr.impact) {
        y = ensurePage(y, 10);
        y = addText(`Impact: ${cr.impact}`, margin + 3, y, contentW - 6, 7.5, [255, 100, 130], "bold");
      }
      y += 8;
    });
  }

  // ── Abuse scenarios page ───────────────────────────────────────────────────
  const sims = analysis.abuse_simulations || [];
  if (sims.length > 0) {
    doc.addPage();
    y = margin;
    y = addText("Abuse Simulations", margin, y, contentW, 14, [240, 239, 248], "bold");
    y += 4;

    sims.forEach((sim, si) => {
      y = ensurePage(y, 40);

      doc.setFillColor(19, 19, 31);
      doc.rect(margin, y - 4, contentW, 10, "F");
      doc.setTextColor(244, 169, 66);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(
        `Scenario ${si + 1}: ${sim.title || sim.scenario_type || "Exploit"}`,
        margin + 3, y + 3
      );
      y += 12;

      (sim.steps || []).forEach((step, i) => {
        y = ensurePage(y, 10);
        y = addText(`  ${i + 1}. ${step}`, margin + 6, y, contentW - 10, 7.5, [180, 178, 200]);
      });

      if (sim.financial_impact) {
        y = ensurePage(y, 8);
        y = addText(`Financial: ${sim.financial_impact}`, margin + 3, y, contentW - 6, 7.5, [255, 100, 130], "bold");
      }
      if (sim.legal_impact) {
        y = ensurePage(y, 8);
        y = addText(`Legal: ${sim.legal_impact}`, margin + 3, y, contentW - 6, 7.5, [124, 106, 247], "bold");
      }
      y += 8;
    });
  }

  // ── Revised clauses page ───────────────────────────────────────────────────
  const withRevisions = issues.filter(i => i.revised_clause);
  if (withRevisions.length > 0) {
    doc.addPage();
    y = margin;
    y = addText("Abuse-Resistant Revised Clauses", margin, y, contentW, 14, [240, 239, 248], "bold");
    y += 6;

    withRevisions.forEach((issue, idx) => {
      y = ensurePage(y, 32);
      const [r, g, b] = riskColors[issue.risk_level] || [150, 150, 150];

      doc.setFillColor(19, 19, 31);
      doc.rect(margin, y - 4, contentW, 9, "F");
      doc.setTextColor(r, g, b);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(`[${issue.risk_level}] ${issue.section || `Issue ${idx + 1}`}`, margin + 3, y + 2);
      y += 10;

      const textLines = doc.splitTextToSize(issue.revised_clause || "", contentW - 10);
      const boxH = textLines.length * 4.8 + 8;
      y = ensurePage(y, boxH + 4);

      doc.setFillColor(14, 14, 26);
      doc.rect(margin, y, contentW, boxH, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(180, 255, 200);
      doc.text(textLines, margin + 5, y + 6);
      y += boxH + 10;
    });
  }

  // ── Top fixes page ─────────────────────────────────────────────────────────
  const fixes = analysis.top_fixes || [];
  if (fixes.length > 0) {
    doc.addPage();
    y = margin;
    y = addText("Top Priority Fixes", margin, y, contentW, 14, [240, 239, 248], "bold");
    y += 6;

    fixes.forEach(fix => {
      y = ensurePage(y, 28);
      doc.setFillColor(19, 19, 31);
      doc.rect(margin, y - 4, contentW, 9, "F");
      doc.setTextColor(124, 106, 247);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`#${fix.rank} — ${fix.issue || ""}`, margin + 3, y + 2);
      y += 10;

      if (fix.why_urgent) {
        y = addText(`⚠ ${fix.why_urgent}`, margin + 3, y, contentW - 6, 7.5, [255, 138, 154]);
      }
      if (fix.action) {
        y = addText(`→ ${fix.action}`, margin + 3, y, contentW - 6, 7.5, [152, 150, 176]);
      }
      y += 8;
    });
  }

  // ── Footer on every page ───────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(90, 88, 110);
    doc.text(
      "RiskRadar analysis for informational purposes only. Not legal advice. Consult a qualified attorney.",
      margin, pageHeight - 8, { maxWidth: contentW - 20 }
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  doc.save(`riskradar-audit-${Date.now()}.pdf`);
}
