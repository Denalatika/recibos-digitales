'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  ArrowLeft 
} from 'lucide-react';
import { PrintableReceiptContainer } from '@/components/receipt/printable-receipt-container';
import { useApp } from '@/context/app-context';

export function ShareClient({ token }: { token: string }) {
  const { getShareLink } = useApp();
  const shareData = getShareLink(token);

  if (!shareData) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 text-center space-y-4 border border-slate-700">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold">Enlace no disponible o expirado</h2>
          <p className="text-xs text-slate-400">
            Este enlace temporal para compartir ya no es válido, ha caducado o fue revocado por el emisor.
          </p>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ir al Inicio</span>
          </Link>
        </div>
      </div>
    );
  }

  const { receipt, link } = shareData;

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Barra Superior con Info */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900">
                Comprobante Compartido: {receipt.folio}
              </h1>
              <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Enlace válido hasta {new Date(link.expires_at).toLocaleDateString('es-MX')}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Recibo Renderizado con Opciones de Impresión */}
        <PrintableReceiptContainer receipt={receipt} />
      </div>
    </div>
  );
}
