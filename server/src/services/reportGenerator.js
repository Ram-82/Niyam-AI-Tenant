import PDFDocument from 'pdfkit';
import { getScoreBand, formatMonth } from '../utils/helpers.js';

const COLORS = {
  primary: '#1A1A2E',
  accent: '#E86B2E',
  surface: '#F7F6F2',
  success: '#2D7D46',
  warning: '#C9801A',
  danger: '#C0392B',
  muted: '#6B7280',
  white: '#FFFFFF',
  border: '#E5E2DC',
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function drawRect(doc, x, y, w, h, color) {
  doc.save().rect(x, y, w, h).fill(color).restore();
}

function sectionHeader(doc, title, y) {
  doc.save()
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(COLORS.primary)
    .text(title, 50, y)
    .moveDown(0.3)
    .restore();
  doc.moveTo(50, y + 18).lineTo(545, y + 18).strokeColor(COLORS.border).stroke();
}

export function generatePdfReport({ client, ca, session, invoices, flags, score, month }) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const totalFlags = flags.length;
    const criticalFlags = flags.filter(f => f.severity === 'critical');
    const warningFlags = flags.filter(f => f.severity === 'warning');
    const band = getScoreBand(score);
    const monthLabel = formatMonth(month);

    // ─── PAGE 1: COVER ─────────────────────────────────────────────
    // Header bar
    drawRect(doc, 0, 0, 595, 80, COLORS.primary);

    doc.font('Helvetica-Bold').fontSize(22).fillColor(COLORS.white)
      .text('Niyam AI', 50, 22);
    doc.font('Helvetica').fontSize(11).fillColor(COLORS.accent)
      .text('GST Pre-Filing Intelligence', 50, 48);

    // Title
    doc.font('Helvetica-Bold').fontSize(28).fillColor(COLORS.primary)
      .text('GST Pre-Filing Report', 50, 110);

    doc.moveTo(50, 148).lineTo(545, 148).strokeColor(COLORS.accent).lineWidth(3).stroke();
    doc.lineWidth(1);

    // Client info block
    drawRect(doc, 50, 160, 495, 100, COLORS.surface);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.muted).text('CLIENT', 70, 175);
    doc.font('Helvetica-Bold').fontSize(16).fillColor(COLORS.primary).text(client.name, 70, 190);
    if (client.gstin) {
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted)
        .text(`GSTIN: ${client.gstin}`, 70, 212);
    }
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted)
      .text(`Period: ${monthLabel}`, 70, 228);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.muted).text('PREPARED BY', 340, 175);
    doc.font('Helvetica').fontSize(11).fillColor(COLORS.primary).text(ca.full_name, 340, 190);
    if (ca.firm_name) {
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted).text(ca.firm_name, 340, 206);
    }
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted)
      .text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 340, 224);

    // Score circle
    const scoreColor = band.color === 'success' ? COLORS.success
      : band.color === 'warning' ? COLORS.warning
        : band.color === 'orange' ? '#E87222'
          : COLORS.danger;

    doc.save()
      .circle(490, 310, 50)
      .lineWidth(6)
      .strokeColor(scoreColor)
      .stroke()
      .restore();

    doc.font('Helvetica-Bold').fontSize(28).fillColor(scoreColor)
      .text(String(score), 463, 293, { width: 55, align: 'center' });
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted)
      .text('out of 100', 463, 324, { width: 55, align: 'center' });

    doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.primary).text('Compliance Score', 50, 285);
    doc.save()
      .roundedRect(50, 310, 180, 32, 6)
      .fill(scoreColor)
      .restore();
    doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.white).text(band.label, 50, 320, { width: 180, align: 'center' });

    // Quick stats row
    const stats = [
      { label: 'Invoices', value: String(invoices.length) },
      { label: 'Total Issues', value: String(totalFlags) },
      { label: 'Critical', value: String(criticalFlags.length) },
      { label: 'Warnings', value: String(warningFlags.length) },
    ];
    const statX = 50;
    const statY = 375;
    stats.forEach((stat, i) => {
      const x = statX + i * 124;
      drawRect(doc, x, statY, 114, 60, i === 2 ? '#FEE2E2' : i === 3 ? '#FEF3C7' : COLORS.surface);
      doc.font('Helvetica-Bold').fontSize(20)
        .fillColor(i === 2 ? COLORS.danger : i === 3 ? COLORS.warning : COLORS.primary)
        .text(stat.value, x, statY + 10, { width: 114, align: 'center' });
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted)
        .text(stat.label, x, statY + 36, { width: 114, align: 'center' });
    });

    // Ready to file
    const readyToFile = score >= 70;
    const rtfColor = readyToFile ? COLORS.success : COLORS.danger;
    const rtfLabel = readyToFile ? '✓  Ready to File' : '✗  Not Ready to File';
    drawRect(doc, 50, 455, 495, 36, readyToFile ? '#D1FAE5' : '#FEE2E2');
    doc.font('Helvetica-Bold').fontSize(13).fillColor(rtfColor)
      .text(rtfLabel, 50, 465, { width: 495, align: 'center' });

    // ─── PAGE 2: SUMMARY ───────────────────────────────────────────
    doc.addPage();
    drawRect(doc, 0, 0, 595, 50, COLORS.primary);
    doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.white).text('Summary', 50, 17);
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.accent)
      .text(`${client.name} — ${monthLabel}`, 50, 35);

    let y = 70;
    sectionHeader(doc, 'Processing Summary', y);
    y += 30;

    const summaryRows = [
      ['Total Invoices Processed', String(invoices.length)],
      ['Total Issues Found', String(totalFlags)],
      ['Critical Issues', String(criticalFlags.length)],
      ['Warnings', String(warningFlags.length)],
      ['Ready to File', readyToFile ? 'Yes' : 'No'],
    ];

    summaryRows.forEach(([label, value], i) => {
      if (i % 2 === 0) drawRect(doc, 50, y, 495, 24, COLORS.surface);
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.primary).text(label, 60, y + 7);
      doc.font('Helvetica-Bold').fontSize(10)
        .fillColor(label === 'Critical Issues' ? COLORS.danger : label === 'Warnings' ? COLORS.warning : COLORS.primary)
        .text(value, 400, y + 7, { width: 140, align: 'right' });
      y += 24;
    });

    y += 20;
    if (criticalFlags.length > 0) {
      sectionHeader(doc, 'Action Required Before Filing', y);
      y += 30;
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted)
        .text('The following critical issues must be resolved before submitting your GST return:', 50, y);
      y += 20;

      for (const flag of criticalFlags) {
        if (y > 720) { doc.addPage(); y = 50; }
        drawRect(doc, 50, y, 4, 22, COLORS.danger);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.danger)
          .text(`[${flag.flag_type}]`, 62, y + 4);
        doc.font('Helvetica').fontSize(9).fillColor(COLORS.primary)
          .text(flag.message, 180, y + 4, { width: 355 });
        y += 28;
      }
    }

    // ─── PAGE 3+: DETAILED FLAGS ───────────────────────────────────
    if (flags.length > 0) {
      doc.addPage();
      drawRect(doc, 0, 0, 595, 50, COLORS.primary);
      doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.white).text('Detailed Issues', 50, 17);
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.accent).text(`${client.name} — ${monthLabel}`, 50, 35);

      y = 70;

      // Group by invoice
      const byInvoice = {};
      for (const flag of flags) {
        const key = flag.invoice_number || 'Unknown Invoice';
        if (!byInvoice[key]) byInvoice[key] = [];
        byInvoice[key].push(flag);
      }

      for (const [invNumber, invFlags] of Object.entries(byInvoice)) {
        if (y > 680) { doc.addPage(); y = 50; }

        drawRect(doc, 50, y, 495, 28, COLORS.primary);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.white)
          .text(`Invoice #${invNumber}`, 60, y + 8);
        y += 36;

        for (const flag of invFlags) {
          if (y > 700) { doc.addPage(); y = 50; }
          const flagColor = flag.severity === 'critical' ? COLORS.danger : COLORS.warning;
          const bgColor = flag.severity === 'critical' ? '#FFF5F5' : '#FFFBEB';
          drawRect(doc, 50, y, 495, 58, bgColor);
          drawRect(doc, 50, y, 4, 58, flagColor);

          doc.save()
            .roundedRect(62, y + 6, 70, 16, 4)
            .fill(flagColor)
            .restore();
          doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.white)
            .text(flag.severity.toUpperCase(), 62, y + 11, { width: 70, align: 'center' });

          doc.font('Helvetica-Bold').fontSize(9).fillColor(flagColor)
            .text(flag.flag_type, 140, y + 8);
          doc.font('Helvetica').fontSize(9).fillColor(COLORS.primary)
            .text(flag.message, 62, y + 28, { width: 478 });
          if (flag.field_name) {
            doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
              .text(`Field: ${flag.field_name}`, 62, y + 42);
          }
          if (flag.actual_value) {
            doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
              .text(`Found: ${flag.actual_value}`, 200, y + 42);
          }
          y += 66;
        }
        y += 10;
      }
    }

    // ─── LAST PAGE: FOOTER NOTE ────────────────────────────────────
    doc.addPage();
    drawRect(doc, 0, 0, 595, 50, COLORS.primary);
    doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.white).text('Disclaimer', 50, 17);

    drawRect(doc, 50, 80, 495, 120, COLORS.surface);
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted)
      .text(
        'This report was generated by Niyam AI. It is a pre-filing validation summary and does not constitute legal or tax advice. Final filing responsibility rests with the Chartered Accountant.\n\nAll data displayed in this report is based on the documents uploaded by the user. Niyam AI does not independently verify GSTIN registrations with the GST portal. Users are advised to cross-verify critical information before submission.',
        70, 95, { width: 455, lineGap: 4 }
      );

    doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
      .text(`Report generated on ${new Date().toLocaleString('en-IN')}`, 50, 230, { align: 'center', width: 495 });

    doc.end();
  });
}
