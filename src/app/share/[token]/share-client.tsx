'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { PrintableReceiptContainer } from '@/components/receipt/printable-receipt-container';
import { useApp } from '@/context/app-context';
import { Receipt, ShareLink } from '@/types/database';

export function ShareClient({ token }: { token: string }) {
  const { getShareLink } = useApp();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [link, setLink] = useState<ShareLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSharedReceipt() {
      try {
        setIsLoading(true);

        // 1. Intentar consultar la API segura en el servidor
        const res = await fetch(`/api/share/${encodeURIComponent(token)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.is_valid && data.receipt) {
            setReceipt(data.receipt);
            setLink(data.link);
            setIsLoading(false);
            return;
          }
        }

        // 2. Fallback a datos locales si existen
        const localData = getShareLink(token);
        if (localData) {
          setReceipt(localData.receipt);
          setLink(localData.link);
          setIsLoading(false);
          return;
        }

        setError('Este enlace para compartir no es válido, ha caducado o fue revocado.');
      } catch (err) {
        console.error('Error cargando comprobante compartido:', err);
        const localData = getShareLink(token);
        if (localData) {
          setReceipt(localData.receipt);
          setLink(localData.link);
        } else {
          setError('Error al consultar el comprobante compartido.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      loadSharedReceipt();
    }
  }, [token, getShareLink]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 text-center space-y-4 border border-slate-700">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
          <h2 className="text-base font-bold">Cargando comprobante compartido...</h2>
        </div>
      </div>
    );
  }

  if (error || !receipt || !link) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 text-center space-y-4 border border-slate-700">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold">Enlace no disponible o expirado</h2>
          <p className="text-xs text-slate-400">
            {error || 'Este enlace temporal para compartir ya no es válido, ha caducado o fue revocado por el emisor.'}
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
