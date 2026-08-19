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

  // Opciones de captura en alta resolución (2.5x scale) con fondo blanco limpio
  const canvas = await html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  
  // Crear documento PDF en formato Carta (Letter Portrait: 215.9 x 279.4 mm)
  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'letter',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const marginX = 8;
  const printableWidth = pdfWidth - marginX * 2;
  const imgWidth = printableWidth;
  const imgHeight = (canvas.height * printableWidth) / canvas.width;

  // Centrar en la hoja tanto horizontal como verticalmente
  const yPos = imgHeight < pdfHeight - 16
    ? (pdfHeight - imgHeight) / 2
    : 8;

  pdf.addImage(imgData, 'PNG', marginX, Math.max(8, yPos), imgWidth, Math.min(imgHeight, pdfHeight - 16));
  pdf.save(filename);
}
