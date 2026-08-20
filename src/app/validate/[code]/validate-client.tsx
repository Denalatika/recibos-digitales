'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface PublicValidationData {
  is_valid: boolean;
  company_name?: string;
  folio?: string;
  internal_folio?: string;
  receipt_type?: string;
  payment_date?: string;
  status?: string;
  verification_code?: string;
  message?: string;
}

export function ValidateClient({ code }: { code: string }) {
  const [data, setData] = useState<PublicValidationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function validateCode() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/validate/${encodeURIComponent(code)}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setData({ is_valid: false, message: 'No se pudo verificar el comprobante' });
        }
      } catch (err) {
        console.error('Error validando comprobante:', err);
        setData({ is_valid: false, message: 'Error de conexión con el servidor de validación' });
      } finally {
        setIsLoading(false);
      }
    }

    if (code) {
      validateCode();
    }
  }, [code]);

  const receiptTypeLabels: Record<string, string> = {
    payroll: 'Nómina',
    collaborator_payment: 'Pago a Colaborador',
    commission: 'Comisiones',
    fees: 'Honorarios',
    reimbursement: 'Reembolso',
    supplier_payment: 'Pago a Proveedor',
    general: 'Comprobante de Pago',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-lg w-full mx-auto my-auto space-y-6">
        {/* Cabecera de Seguridad */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-900/30">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Portal de Validación de Comprobante
          </h1>
          <p className="text-xs text-slate-400">
            Verificación pública de autenticidad interna emitida por la organización.
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white text-slate-900 rounded-2xl p-8 shadow-2xl space-y-4 border border-slate-200 text-center">
            <Loader2 className="w-8 h-8 text-cyan-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Verificando autenticidad en registros seguros...</p>
          </div>
        ) : data && data.is_valid ? (
          <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 border border-slate-200">
            {/* Estado de Validez */}
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center space-x-3 text-emerald-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h2 className="font-black text-sm">Comprobante Válido y Registrado</h2>
                <p className="text-xs text-emerald-700 font-semibold">
                  Documento emitido formalmente en los registros administrativos internos.
                </p>
              </div>
            </div>

            {/* Metadatos Públicos Seguros (Sin PII, sin importes, sin cuentas) */}
            <div className="space-y-3 divide-y divide-slate-100 text-xs">
              <div className="pt-2 flex justify-between items-center">
                <span className="font-extrabold text-slate-400 uppercase text-[10px]">EMPRESA EMISORA</span>
                <span className="font-bold text-slate-900 text-right">
                  {data.company_name || 'Empresa Emisora'}
                </span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="font-extrabold text-slate-400 uppercase text-[10px]">FOLIO DEL RECIBO</span>
                <span className="font-black text-slate-900 font-mono text-sm">{data.folio}</span>
              </div>

              {data.internal_folio && (
                <div className="pt-2 flex justify-between items-center">
                  <span className="font-extrabold text-slate-400 uppercase text-[10px]">FOLIO INTERNO</span>
                  <span className="font-bold text-slate-700 font-mono">{data.internal_folio}</span>
                </div>
              )}

              <div className="pt-2 flex justify-between items-center">
                <span className="font-extrabold text-slate-400 uppercase text-[10px]">TIPO DE COMPROBANTE</span>
                <span className="font-semibold text-slate-800">
                  {data.receipt_type ? (receiptTypeLabels[data.receipt_type] || data.receipt_type) : 'Nómina'}
                </span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="font-extrabold text-slate-400 uppercase text-[10px]">FECHA DE PAGO</span>
                <span className="font-semibold text-slate-800">{formatDate(data.payment_date, 'clean')}</span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="font-extrabold text-slate-400 uppercase text-[10px]">ESTADO ACTUAL</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {data.status === 'paid' ? 'Pagado y Liquidado' : (data.status || 'Registrado')}
                </span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="font-extrabold text-slate-400 uppercase text-[10px]">CÓDIGO DE VERIFICACIÓN</span>
                <span className="font-bold font-mono text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                  {data.verification_code || code}
                </span>
              </div>
            </div>

            {/* Nota de Privacidad */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start space-x-2">
              <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Protección de Datos:</strong> Por políticas de privacidad y confidencialidad administrativa, los datos bancarios, RFC, importes y percepciones individuales no se exponen en este portal público.
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4 border border-rose-200 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-lg font-black text-slate-900">Código de Verificación No Encontrado</h2>
            <p className="text-xs text-slate-600">
              No se encontró ningún comprobante activo con el código <span className="font-mono font-bold text-rose-600">{code}</span>.
            </p>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ir a la Plataforma Principal</span>
          </Link>
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-500 py-4">
        Plataforma de Recibos Digitales Administrativos • Validación Segura
      </div>
    </div>
  );
}
