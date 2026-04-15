import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

// Apply the autoTable plugin to jsPDF
applyPlugin(jsPDF);

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: any;
  }
}

export interface ReportData {
  headers: string[];
  rows: (string | number)[][];
  title: string;
  subtitle: string;
  totals?: { label: string; value: string }[];
}

export function generatePDFReport(data: ReportData) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text(data.title, 14, 20);

  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(data.subtitle, 14, 28);
  doc.setTextColor(0);

  // Table
  (doc as any).autoTable({
    head: [data.headers],
    body: data.rows,
    startY: 35,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  // Totals
  if (data.totals && data.totals.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');

    data.totals.forEach((total, index) => {
      doc.text(`${total.label}:`, 14, finalY + (index * 7));
      doc.text(total.value, 150, finalY + (index * 7));
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
}
