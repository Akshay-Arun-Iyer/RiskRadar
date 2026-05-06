/**
 * pdfExport.js
 * Generates a downloadable PDF report of the contract analysis
 * using jsPDF and jsPDF-autotable.
 */

import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * Download the analysis results as a formatted PDF report.
 * @param {Object} analysis - The analysis object from the API
 * @param {string} [contractName] - Optional name for the report header
 */
export function downloadAnalysisAsPDF(analysis, contractName = "Contract") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // ── Helper: add text with wrapping ─────────────────────────────────────
  function addWrappedText(text, x, y, maxWidth, lineHeight = 5.5) {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * lineHeight;
  }

  // ── Color map for risk levels ───────────────────────────────────────────
  const riskColors = {
    High:   [220, 38, 60],
    Medium: [217, 119, 6],
    Low:    [16, 163, 127],
  };

  let y = margin;

  // ── Page 1: Header ──────────────────────────────────────────────────────
  // Dark header band
  doc.setFillColor(9, 9, 15);
  doc.rect(0, 0, pageWidth, 42, "F");

  doc.setTextColor(240, 239, 248);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("AI Contract Analyzer", margin, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(152, 150, 176);
  doc.text("Automated Legal Risk Assessment Report", margin, 26);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 32);
  doc.text(`Document: ${contractName}`, margin, 38);

  y = 54;

  // ── Risk Count Summary ─────────────────────────────────────────────────
  const issues = analysis.issues || [];
  const counts = { High: 0, Medium: 0, Low: 0 };
  issues.forEach((i) => { if (counts[i.risk_level] !== undefined) counts[i.risk_level]++; });

  // Summary box
  doc.setFillColor(19, 19, 31);
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(152, 150, 176);
  doc.text("OVERALL RISK SUMMARY", margin + 6, y + 7);

  const colW = contentWidth / 3;
  ["High", "Medium", "Low"].forEach((level, i) => {
    const cx = margin + 6 + i * colW;
    const [r, g, b] = riskColors[level];
    doc.setTextColor(r, g, b);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(String(counts[level]), cx, y + 20);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(152, 150, 176);
    doc.text(`${level} Risk`, cx, y + 26);
  });

  y += 36;

  // ── Summary Text ───────────────────────────────────────────────────────
  if (analysis.summary) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(100, 98, 120);
    y = addWrappedText(analysis.summary, margin, y, contentWidth);
    y += 8;
  }

  // ── Issues Table ───────────────────────────────────────────────────────
  if (issues.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(62, 207, 142);
    doc.text("✓ No significant issues found.", margin, y);
  } else {
    doc.autoTable({
      startY: y,
      head: [["#", "Clause / Section", "Risk", "Problem", "Suggestion"]],
      body: issues.map((issue, idx) => [
        idx + 1,
        issue.clause || "—",
        issue.risk_level || "—",
        issue.problem || "—",
        issue.suggestion || "—",
      ]),
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
        textColor: [60, 58, 80],
      },
      headStyles: {
        fillColor: [19, 19, 31],
        textColor: [152, 150, 176],
        fontStyle: "bold",
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 35 },
        2: { cellWidth: 16 },
        3: { cellWidth: 60 },
        4: { cellWidth: 55 },
      },
      didParseCell: function (data) {
        // Color the Risk column cells
        if (data.column.index === 2 && data.section === "body") {
          const level = data.cell.raw;
          const [r, g, b] = riskColors[level] || [150, 150, 150];
          data.cell.styles.textColor = [r, g, b];
          data.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY + 10;
  }

  // ── Revised Clauses Pages ──────────────────────────────────────────────
  const withRevisions = issues.filter((i) => i.revised_clause);
  if (withRevisions.length > 0) {
    doc.addPage();
    y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(240, 239, 248);
    doc.text("Revised Clauses", margin, y);
    y += 10;

    withRevisions.forEach((issue, idx) => {
      // Check if we need a new page
      if (y > 260) {
        doc.addPage();
        y = margin;
      }

      const [r, g, b] = riskColors[issue.risk_level] || [150, 150, 150];

      // Issue header
      doc.setFillColor(19, 19, 31);
      doc.rect(margin, y - 4, contentWidth, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(r, g, b);
      doc.text(`[${issue.risk_level}] Issue ${idx + 1}: ${issue.clause || ""}`, margin + 3, y + 3);
      y += 10;

      // Revised clause box
      doc.setFillColor(14, 14, 26);
      const textLines = doc.splitTextToSize(issue.revised_clause || "", contentWidth - 10);
      const boxH = textLines.length * 5 + 8;
      doc.rect(margin, y, contentWidth, boxH, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(180, 178, 200);
      doc.text(textLines, margin + 5, y + 6);
      y += boxH + 10;
    });
  }

  // ── Footer on all pages ────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(90, 88, 110);
    doc.text(
      "This report is generated by AI and is for informational purposes only. It does not constitute legal advice. Consult a qualified attorney for legal matters.",
      margin,
      doc.internal.pageSize.getHeight() - 8,
      { maxWidth: contentWidth }
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 8,
      { align: "right" }
    );
  }

  // ── Save ───────────────────────────────────────────────────────────────
  const filename = `contract-analysis-${Date.now()}.pdf`;
  doc.save(filename);
}
