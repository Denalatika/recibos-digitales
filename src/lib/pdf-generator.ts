'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DownloadPdfOptions {
  elementId: string;
  filename?: string;
  orientation?: 'landscape' | 'portrait';
}

export async function downloadReceiptAsPdf({ 
  elementId, 
  filename = 'recibo.pdf',
  orientation = 'portrait'
}: DownloadPdfOptions) {
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
  
  // Crear documento PDF en orientación seleccionada (Letter)
  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'letter',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const margin = 6;
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
