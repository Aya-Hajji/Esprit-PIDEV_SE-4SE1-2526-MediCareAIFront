import { jsPDF } from 'jspdf';
import type { ChatMessage } from '../services/medical-chat.service';

export interface RecordAssistantPdfMeta {
  patientId?: number | null;
  recordId?: number | null;
  importedPdfFileName?: string | null;
}

function stripMarkdownForPdf(text: string): string {
  return text
    .replace(/\*\*([\s\S]+?)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1');
}

function formatMessageTime(ts?: Date): string {
  if (!ts) {
    return '';
  }
  try {
    const d = ts instanceof Date ? ts : new Date(ts as unknown as string);
    return d.toLocaleString();
  } catch {
    return '';
  }
}

/**
 * Branded PDF export for the Record assistant (header, metadata, threaded messages, disclaimer).
 */
export function downloadRecordAssistantConversationPdf(
  messages: ChatMessage[],
  meta: RecordAssistantPdfMeta = {}
): void {
  if (!messages.some((m) => m.sender === 'user')) {
    return;
  }
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const maxW = pageW - margin * 2;
  const bottomReserve = 14;
  let y = margin;

  const BRAND = { r: 37, g: 99, b: 235 };

  /** Header band */
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, pageW, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('MediCare AI', margin, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text('Record assistant — conversation export', margin, 21);
  doc.setTextColor(0, 0, 0);

  y = 36;

  doc.setFontSize(9);
  doc.setTextColor(65, 65, 65);
  doc.text(`Exported: ${new Date().toLocaleString()}`, margin, y);
  y += 5;

  const idParts: string[] = [];
  if (meta.patientId != null && meta.patientId !== undefined) {
    idParts.push(`Patient #${meta.patientId}`);
  }
  if (meta.recordId != null && meta.recordId !== undefined) {
    idParts.push(`Record #${meta.recordId}`);
  }
  if (idParts.length) {
    doc.text(idParts.join('  ·  '), margin, y);
    y += 5;
  }
  if (meta.importedPdfFileName) {
    doc.setFont('helvetica', 'normal');
    const srcLines = doc.splitTextToSize(`Source PDF: ${meta.importedPdfFileName}`, maxW);
    doc.text(srcLines, margin, y);
    y += Math.max(srcLines.length, 1) * 4.2 + 2;
  }

  doc.setTextColor(0, 0, 0);
  y += 3;
  doc.setDrawColor(220, 226, 234);
  doc.setLineWidth(0.35);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  const bodySize = 10;
  const lineH = 4.6;
  const roleBandH = 6;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - bottomReserve) {
      doc.addPage();
      y = margin;
    }
  };

  for (const msg of messages) {
    const role = msg.sender === 'user' ? 'You' : 'Assistant';
    const roleRgb = msg.sender === 'user' ? ([23, 78, 180] as const) : ([55, 65, 81] as const);
    const timeStr = formatMessageTime(msg.timestamp);
    const plain = stripMarkdownForPdf(msg.text);

    doc.setFontSize(bodySize);
    const bodyLines = doc.splitTextToSize(plain, maxW - 2);
    const blockH = roleBandH + bodyLines.length * lineH + 5;

    ensureSpace(blockH);

    doc.setFillColor(243, 246, 252);
    doc.rect(margin, y - 2, pageW - margin * 2, roleBandH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(roleRgb[0], roleRgb[1], roleRgb[2]);
    doc.text(role, margin + 2, y + 3.2);
    if (timeStr) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(130, 130, 130);
      const tw = doc.getTextWidth(timeStr);
      doc.text(timeStr, pageW - margin - tw - 2, y + 3.2);
    }
    doc.setTextColor(0, 0, 0);
    y += roleBandH + 1;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(bodySize);
    for (const line of bodyLines) {
      ensureSpace(lineH);
      doc.text(line, margin + 1, y);
      y += lineH;
    }
    y += 4;
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 110);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'General information from on-screen data — not medical advice.',
      margin,
      pageH - 7,
      { maxWidth: maxW }
    );
    doc.text(`${i} / ${totalPages}`, pageW - margin - 14, pageH - 7);
    doc.setTextColor(0, 0, 0);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`MediCareAI_record-assistant_${stamp}.pdf`);
}
