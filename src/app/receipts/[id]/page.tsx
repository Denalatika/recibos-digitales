'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Share2, 
  Edit3, 
  Copy, 
  CheckCircle2, 
  Clock, 
  Ban, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { ReceiptTemplate } from '@/components/receipt/receipt-template';
import { useApp } from '@/context/app-context';
import { downloadReceiptAsPdf } from '@/lib/pdf-generator';
import { ReceiptStatus } from '@/types/database';

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { getReceipt, updateReceiptStatus, duplicateReceipt, createShareLink } = useApp();

  const receipt = getReceipt(id);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareInfo, setShareInfo] = useState<{ token: string; url: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!receipt) {
    return (
      <AppLayout>
        <div className="text-center py-16 space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Recibo no encontrado</h2>
          <p className="text-xs text-slate-500">El comprobante solicitado no existe o fue eliminado.</p>
          <Link
            href="/receipts"
            className="inline-flex items-center space-x-2 bg-slate-900 text-white font-bold text-xs py-2 px-4 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Recibos</span>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      await downloadReceiptAsPdf({
        elementId: 'receipt-detail-container',
        filename: `RECIBO_${receipt.company?.folio_prefix || 'DOC'}_${receipt.folio}_${receipt.person?.full_name?.replace(/\s+/g, '_') || 'RECIBO'}.pdf`
      });
    } catch (err) {
      alert('Error al generar PDF: ' + err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenShareModal = () => {
    const info = createShareLink(receipt.id, 72); // 72 horas por defecto
    setShareInfo(info);
    setShareModalOpen(true);
  };

  const handleCopyLink = () => {
    if (shareInfo) {
      navigator.clipboard.writeText(shareInfo.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const statusOptions: { value: ReceiptStatus; label: string; icon: React.ReactNode }[] = [
    { value: 'draft', label: 'Borrador', icon: <Clock className="w-3.5 h-3.5" /> },
    { value: 'authorized', label: 'Autorizado', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { value: 'paid', label: 'Pagado', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { value: 'cancelled', label: 'Cancelado', icon: <Ban className="w-3.5 h-3.5" /> },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Barra Superior con Acciones del Documento */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 no-print">
          <div className="flex items-center space-x-3">
            <Link
              href="/receipts"
              className="p-2 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {receipt.folio}
                </h1>
                <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                  {receipt.person?.full_name}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Código de verificación: <span className="font-mono font-bold text-slate-700">{receipt.verification_code}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de Estado */}
            <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200">
              {statusOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateReceiptStatus(receipt.id, opt.value)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                    receipt.status === opt.value
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <Link
              href={`/receipts/${receipt.id}/edit`}
              className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3 rounded-lg border border-slate-300 shadow-sm transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </Link>

            <button
              onClick={() => {
                const dup = duplicateReceipt(receipt.id);
                router.push(`/receipts/${dup.id}`);
              }}
              className="flex items-center space-x-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs py-2 px-3 rounded-lg border border-purple-200 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicar</span>
            </button>

            <button
              onClick={handleOpenShareModal}
              className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs py-2 px-3 rounded-lg border border-emerald-200 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Generando...' : 'Descargar PDF'}</span>
            </button>
          </div>
        </div>

        {/* Hoja de Recibo */}
        <div id="receipt-detail-container" className="p-2 bg-slate-100/60 rounded-2xl border border-slate-200/80 overflow-x-auto">
          <ReceiptTemplate receipt={receipt} />
        </div>

        {/* Modal de Compartir Enlace Temporal Seguro */}
        {shareModalOpen && shareInfo && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Enlace Temporal Seguro</h3>
                  <p className="text-xs text-slate-500">Comparte este comprobante de forma cifrada y con caducidad.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">URL del Comprobante</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={shareInfo.url}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-700 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-2 rounded-lg transition-colors shrink-0"
                  >
                    {copied ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p>⏱ <strong>Vigencia:</strong> 72 horas (hasta {new Date(shareInfo.expiresAt).toLocaleString('es-MX')})</p>
                <p>🔒 <strong>Seguridad:</strong> El enlace no expone contraseñas ni datos sensibles adicionales.</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 px-4 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
