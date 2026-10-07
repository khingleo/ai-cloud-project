import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface BrandedPdfOptions {
  title: string;
  filename: string;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
}

function drawBrand(doc: jsPDF, pageWidth: number, pageHeight: number, title: string, pageNumber: number, pageCount: number, generatedAt: string) {
  doc.setFillColor(255, 204, 0);
  doc.roundedRect(12, 9, 31, 19, 2, 2, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('MTN', 27.5, 21, { align: 'center' });
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.text('EBD', 49, 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('ENTERPRISE BUSINESS', 49, 23);

  doc.setDrawColor(255, 204, 0);
  doc.setLineWidth(1.2);
  doc.line(12, 32, pageWidth - 12, 32);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, 12, 41, { maxWidth: pageWidth - 80 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated ${generatedAt}`, pageWidth - 12, 41, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(12, pageHeight - 13, pageWidth - 12, pageHeight - 13);
  doc.setFontSize(7);
  doc.text('MTN EBD · Internal business report', 12, pageHeight - 8);
  doc.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - 12, pageHeight - 8, { align: 'right' });
}

export function exportBrandedTablePdf({ title, filename, headers, rows }: BrandedPdfOptions) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const generatedAt = new Date().toLocaleString();
  const body = rows.map((row) => row.map((cell) => cell == null ? '' : String(cell)));

  doc.setProperties({
    title: `MTN EBD - ${title}`,
    subject: 'Enterprise business data export',
    creator: 'MTN Enterprise Hub',
  });

  autoTable(doc, {
    head: [headers],
    body,
    startY: 48,
    margin: { top: 48, right: 12, bottom: 17, left: 12 },
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 2,
      overflow: 'linebreak',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [255, 204, 0],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawPage: (data) => {
      drawBrand(doc, pageWidth, pageHeight, title, data.pageNumber, doc.getNumberOfPages(), generatedAt);
    },
  });

  doc.save(filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`);
}
