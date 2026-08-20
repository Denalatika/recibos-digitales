'use client';

import React, { useState } from 'react';
import { Receipt, Company, Person } from '@/types/database';
import { ReceiptTemplate } from './receipt-template';
import { Scissors, FileText, Files, Printer, Download } from 'lucide-react';
import { downloadReceiptAsPdf } from '@/lib/pdf-generator';

interface PrintableReceiptContainerProps {
  receipt: Receipt;
  companyOverride?: Partial<Company>;
  personOverride?: Partial<Person>;
  showControls?: boolean;
}

export function PrintableReceiptContainer({
  receipt,
  companyOverride,
  personOverride,
  showControls = true,
}: PrintableReceiptContainerProps) {
  // 'dual' = 2 recibos por hoja (Carta Vertical - Original y Copia)
  // 'single' = 1 recibo por hoja (Carta Vertical - Mismo tamaño media carta en la parte superior)
  const [printLayout, setPrintLayout] = useState<'dual' | 'single'>('dual');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      await downloadReceiptAsPdf({
        elementId: 'printable-area-target',
        filename: `RECIBO_${receipt.company?.folio_prefix || 'DOC'}_${receipt.folio}_${printLayout === 'dual' ? '2_POR_HOJA' : '1_POR_HOJA'}.pdf`,
        orientation: 'portrait',
      });
    } catch (err) {
      alert('Error al generar PDF: ' + err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Inyección de regla @page y estilos de impresión centrados en Carta Vertical */}
      <style jsx global>{`
        @page {
          size: letter portrait !important;
          margin: 10mm 8mm !important;
        }
        @media print {
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }

          /* Ocultar elementos de interfaz ajenos */
          body * {
            visibility: hidden;
          }

          /* Hacer visible el contenedor de impresión e hijos */
          #printable-area-target,
          #printable-area-target * {
            visibility: visible !important;
          }

          #printable-area-target {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            display: block !important;
          }

          .print-dual-container {
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            gap: 3mm !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
          }

          .print-dual-item {
            width: 100% !important;
            max-width: 100% !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .print-cut-line {
            margin: 2mm 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .receipt-sheet {
            width: 100% !important;
            max-width: 100% !important;
            border: 1px solid #94a3b8 !important;
            border-radius: 4px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Controles de visualización e impresión */}
      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm no-print">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">Formato de Impresión:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
              <button
                type="button"
                onClick={() => setPrintLayout('dual')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  printLayout === 'dual'
                    ? 'bg-white text-cyan-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Files className="w-3.5 h-3.5" />
                <span>2 por Hoja (Carta Vertical)</span>
              </button>

              <button
                type="button"
                onClick={() => setPrintLayout('single')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  printLayout === 'single'
                    ? 'bg-white text-cyan-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>1 por Hoja (Carta Vertical)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3.5 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2 px-3.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Generando...' : 'Descargar PDF'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Área Imprimible / Vista Previa */}
      <div 
        id="printable-area-target"
        className="p-3 bg-slate-100/60 rounded-2xl border border-slate-200/80 overflow-x-auto print:p-0 print:bg-transparent print:border-none print:shadow-none print:m-0"
      >
        <div className="print-dual-container space-y-3 print:space-y-0 w-full max-w-[1000px] mx-auto">
          {/* 1er Tanto: Original */}
          <div className="print-dual-item">
            <ReceiptTemplate 
              receipt={receipt} 
              companyOverride={companyOverride}
              personOverride={personOverride}
              copyBadge={printLayout === 'dual' ? 'ORIGINAL' : undefined} 
            />
          </div>

          {/* Si está seleccionado '2 por Hoja', mostrar línea de corte y segundo tanto */}
          {printLayout === 'dual' && (
            <>
              {/* Línea de corte / talón */}
              <div className="print-cut-line relative py-2.5 print:py-2 flex items-center justify-center select-none w-full">
                <div className="border-t-2 border-dashed border-slate-300 print:border-slate-400 w-full absolute inset-x-0"></div>
                <span className="relative z-10 bg-white px-4 py-0.5 text-[9px] font-bold text-slate-500 uppercase flex items-center space-x-2 border border-slate-300 print:border-slate-400 rounded-full shadow-xs">
                  <Scissors className="w-3.5 h-3.5 text-slate-400" />
                  <span>LÍNEA DE CORTE • COPIA COLABORADOR</span>
                </span>
              </div>

              {/* 2do Tanto: Copia */}
              <div className="print-dual-item">
                <ReceiptTemplate 
                  receipt={receipt} 
                  companyOverride={companyOverride}
                  personOverride={personOverride}
                  copyBadge="COPIA" 
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
