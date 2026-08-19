'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DownloadPdfOptions {
  elementId: string;
  filename?: string;
}

export async function downloadReceiptAsPdf({ elementId, filename = 'recibo.pdf' }: DownloadPdfOptions) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Elemento con ID "${elementId}" no encontrado.`);
  }

  // Opciones de captura en alta resolución (2x scale)
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1200,
  });

  const imgData = canvas.toDataURL('image/png');
  
  // Crear documento PDF en orientación horizontal (Landscape)
  // Tamaño carta: 279.4 x 215.9 mm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'letter',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const margin = 8;
  const printableWidth = pdfWidth - margin * 2;
  const printableHeight = pdfHeight - margin * 2;

  const imgWidth = printableWidth;
  const imgHeight = (canvas.height * printableWidth) / canvas.width;

  // Si la altura calculada cabe en una página, centrarla verticalmente
  const yPos = imgHeight <= printableHeight 
    ? margin + (printableHeight - imgHeight) / 2 
    : margin;

  pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, Math.min(imgHeight, printableHeight));
  pdf.save(filename);
}
