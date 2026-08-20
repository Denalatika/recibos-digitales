'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle2,
  Clock,
  Ban,
  ShieldCheck
} from 'lucide-react';
import { Receipt, Company, Person } from '@/types/database';
import { formatDate, formatPeriod, formatCurrency, maskBankAccount } from '@/lib/utils';

export interface ReceiptTemplateProps {
  receipt: Receipt;
  companyOverride?: Partial<Company>;
  personOverride?: Partial<Person>;
  scale?: number;
  className?: string;
  isPrintMode?: boolean;
  copyBadge?: string;
}

export const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({
  receipt,
  companyOverride,
  personOverride,
  scale = 1,
  className = '',
  isPrintMode = false,
  copyBadge,
}) => {
  const company = { ...(receipt.company || {}), ...(companyOverride || {}) } as Company;
  const person = { ...(receipt.person || {}), ...(personOverride || {}) } as Person;

  const earnings = receipt.earnings || [];
  const deductions = receipt.deductions || [];

  // Variables de color con fallbacks
  const primaryColor = company.primary_color || '#0b192c';
  const secondaryColor = company.secondary_color || '#334155';
  const accentColor = company.accent_color || '#00a8cc';

  // URL pública para el código QR
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const qrValidationUrl = `${baseUrl}/validate/${receipt.verification_code}`;

  // Título del tipo de documento
  const receiptTypeTitles: Record<string, string> = {
    payroll: 'RECIBO DE NÓMINA',
    collaborator_payment: 'COMPROBANTE DE PAGO A COLABORADOR',
    commission: 'RECIBO DE COMISIONES',
    fees: 'COMPROBANTE DE HONORARIOS',
    reimbursement: 'RECIBO DE REEMBOLSO',
    supplier_payment: 'COMPROBANTE DE PAGO A PROVEEDOR',
    general: 'COMPROBANTE DE PAGO',
  };

  const personTypeHeaders: Record<string, string> = {
    worker: 'TRABAJADOR',
    collaborator: 'COLABORADOR',
    user: 'USUARIO',
    client: 'CLIENTE',
    supplier: 'PROVEEDOR',
    other: 'BENEFICIARIO',
  };

  const frequencyLabels: Record<string, string> = {
    weekly: 'SEMANAL',
    biweekly: 'QUINCENAL',
    monthly: 'MENSUAL',
    special: 'ESPECIAL',
    other: 'ORDINARIO',
  };

  const statusBadges: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'BORRADOR', color: 'text-amber-700 bg-amber-50 border-amber-300', icon: <Clock className="w-3 h-3" /> },
    authorized: { label: 'AUTORIZADO', color: 'text-blue-700 bg-blue-50 border-blue-300', icon: <ShieldCheck className="w-3 h-3" /> },
    paid: { label: 'PAGADO', color: 'text-emerald-700 bg-emerald-50 border-emerald-300', icon: <CheckCircle2 className="w-3 h-3" /> },
    cancelled: { label: 'CANCELADO', color: 'text-rose-700 bg-rose-50 border-rose-300', icon: <Ban className="w-3 h-3" /> },
  };

  const currentStatus = statusBadges[receipt.status] || statusBadges.draft;

  return (
    <div 
      className={`receipt-sheet bg-white text-slate-800 shadow-sm print:shadow-none border border-slate-300 print:border-slate-400 rounded-lg overflow-visible mx-auto font-sans w-full ${className}`}
      style={{
        width: '100%',
        maxWidth: isPrintMode ? '100%' : '980px',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
        fontFamily: 'Arial, Helvetica, sans-serif',
        letterSpacing: 'normal',
      }}
    >
      {/* 1. ENCABEZADO SUPERIOR */}
      <div className="receipt-header relative flex flex-row items-stretch justify-between bg-white border-b border-slate-300 min-h-[70px]">
        {/* Bloque Izquierdo con Corte Diagonal */}
        <div 
          className="receipt-header-polygon flex-1 flex items-center px-4 py-2 pr-8 min-w-0"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center space-x-3">
            {company.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={company.name} 
                className="h-10 max-h-10 max-w-[65px] w-auto object-contain drop-shadow-sm shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-md bg-white/15 flex items-center justify-center border border-white/20 text-white shrink-0">
                <Building2 className="w-5 h-5 text-white/90" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-white font-bold text-sm md:text-[15px] uppercase leading-snug truncate">
                {company.business_name || company.name || 'EMPRESA DEMO'}
              </h1>
              {company.slogan && (
                <p 
                  className="font-medium text-[9px] uppercase mt-0.5 truncate"
                  style={{ color: accentColor }}
                >
                  {company.slogan}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bloque Derecho: Título, Badge y Metadatos con ancho suficiente para periodos largos */}
        <div className="px-3.5 py-1.5 w-[335px] shrink-0 bg-white flex flex-col justify-center text-right">
          <div className="flex flex-col items-end mb-1">
            {copyBadge && (
              <span className="inline-block mb-0.5 text-[8.5px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-white shadow-xs">
                {copyBadge}
              </span>
            )}
            <h2 className="font-bold text-slate-900 text-sm md:text-[15px] uppercase leading-tight">
              {receiptTypeTitles[receipt.receipt_type] || 'RECIBO DE NÓMINA'}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-left text-[9.5px] leading-normal">
            <span className="font-bold text-slate-900 uppercase">FOLIO:</span>
            <span className="font-bold text-slate-900 text-right font-mono">{receipt.folio}</span>

            <span className="font-bold text-slate-900 uppercase">FECHA DE PAGO:</span>
            <span className="text-slate-700 font-medium text-right">{formatDate(receipt.payment_date, 'with_slashes')}</span>

            <span className="font-bold text-slate-900 uppercase">PERIODO:</span>
            <span className="text-slate-700 font-medium text-right text-[9px] whitespace-nowrap">
              {formatPeriod(receipt.period_start, receipt.period_end)}
            </span>

            <span className="font-bold text-slate-900 uppercase">NÓMINA / TIPO:</span>
            <span className="text-slate-800 font-bold uppercase text-right">
              {frequencyLabels[receipt.frequency] || 'QUINCENAL'}
            </span>
          </div>
        </div>
      </div>

      {/* CUERPO DEL RECIBO */}
      <div className="p-3 space-y-2.5">
        {/* 2. SECCIÓN DE LA PERSONA / COLABORADOR */}
        <div className="border-b border-slate-200 pb-1.5">
          <div className="flex items-center justify-between mb-1">
            <h3 
              className="font-bold text-[10.5px] uppercase"
              style={{ color: accentColor }}
            >
              {personTypeHeaders[person.person_type] || 'COLABORADOR'}
            </h3>
            {person.status === 'archived' && (
              <span className="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">
                Archivado
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px] leading-normal">
            {/* Columna Izquierda */}
            <div className="space-y-0.5">
              <div className="flex items-center">
                <span className="w-24 font-bold text-slate-900 uppercase shrink-0">NOMBRE:</span>
                <span className="font-bold text-slate-900 flex-1">{person.full_name || '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 font-bold text-slate-900 uppercase shrink-0">NÚMERO INT:</span>
                <span className="font-medium text-slate-700 flex-1">{person.internal_id || '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 font-bold text-slate-900 uppercase shrink-0">PUESTO:</span>
                <span className="font-medium text-slate-700 flex-1">{person.position || '-'}</span>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-0.5">
              <div className="flex items-center">
                <span className="w-24 font-bold text-slate-900 uppercase shrink-0">DEPTO:</span>
                <span className="font-medium text-slate-700 flex-1">{person.department || '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 font-bold text-slate-900 uppercase shrink-0">R.F.C.:</span>
                <span className="font-medium text-slate-700 flex-1">{person.rfc || '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 font-bold text-slate-900 uppercase shrink-0">RÉGIMEN:</span>
                <span className="font-medium text-slate-700 flex-1">
                  {person.contract_type || 'Sueldos y Asimilados'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. TABLAS DE PERCEPCIONES, DEDUCCIONES Y NETO (Con espaciado vertical holgado por fila) */}
        <div className="grid grid-cols-12 gap-2.5 items-stretch">
          {/* Tabla 1: Percepciones (5 cols) */}
          <div className="col-span-5 rounded border border-slate-200 overflow-hidden flex flex-col justify-between">
            <div>
              <div 
                className="text-white font-bold uppercase px-2.5 py-1 text-[9.5px]"
                style={{ backgroundColor: '#0f766e' }}
              >
                PERCEPCIONES
              </div>
              <table className="w-full text-[9.5px] border-collapse" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                    <th className="py-1 px-2 text-left" style={{ width: '50%' }}>CONCEPTO</th>
                    <th className="py-1 px-1 text-center" style={{ width: '24%' }}>REF</th>
                    <th className="py-1 px-2 text-right" style={{ width: '26%' }}>IMPORTE</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map((e, idx) => (
                    <tr key={e.id || idx} className="border-b border-slate-100 last:border-b-0">
                      <td className="py-1.5 px-2 font-medium text-slate-800 leading-normal align-middle">
                        {e.concept}
                      </td>
                      <td className="py-1.5 px-1 text-[8.5px] text-center text-slate-500 whitespace-nowrap align-middle">
                        {e.reference || '-'}
                      </td>
                      <td className="py-1.5 px-2 text-right font-semibold text-slate-900 whitespace-nowrap align-middle">
                        {formatCurrency(e.amount)}
                      </td>
                    </tr>
                  ))}
                  {earnings.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-3 text-center text-slate-400 italic text-[9px]">Sin percepciones</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 flex items-center justify-between font-bold px-2.5 py-1 text-[9.5px]">
              <span className="text-slate-800 uppercase">TOTAL PERCEPCIONES</span>
              <span className="font-bold" style={{ color: '#0f766e' }}>
                {formatCurrency(receipt.total_earnings)}
              </span>
            </div>
          </div>

          {/* Tabla 2: Deducciones (4 cols con anchos holgados y filas sin encimarse) */}
          <div className="col-span-4 rounded border border-slate-200 overflow-hidden flex flex-col justify-between">
            <div>
              <div 
                className="text-white font-bold uppercase px-2.5 py-1 text-[9.5px]"
                style={{ backgroundColor: secondaryColor }}
              >
                DEDUCCIONES
              </div>
              <table className="w-full text-[9.5px] border-collapse" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                    <th className="py-1 px-1.5 text-left" style={{ width: '40%' }}>CONCEPTO</th>
                    <th className="py-1 px-1 text-center" style={{ width: '28%' }}>REF</th>
                    <th className="py-1 px-1.5 text-right" style={{ width: '32%' }}>IMPORTE</th>
                  </tr>
                </thead>
                <tbody>
                  {deductions.map((d, idx) => (
                    <tr key={d.id || idx} className="border-b border-slate-100 last:border-b-0">
                      <td className="py-1.5 px-1.5 font-medium text-slate-800 leading-normal align-middle">
                        {d.concept}
                      </td>
                      <td className="py-1.5 px-1 text-[8px] text-center text-slate-500 whitespace-nowrap align-middle">
                        {d.reference || '-'}
                      </td>
                      <td className="py-1.5 px-1.5 text-right font-semibold text-slate-900 whitespace-nowrap align-middle">
                        {formatCurrency(d.amount)}
                      </td>
                    </tr>
                  ))}
                  {deductions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-3 text-center text-slate-400 italic text-[9px]">Sin deducciones</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 flex items-center justify-between font-bold px-2.5 py-1 text-[9.5px]">
              <span className="text-slate-800 uppercase">TOTAL DEDUCCIONES</span>
              <span className="font-bold" style={{ color: '#0f766e' }}>
                {formatCurrency(receipt.total_deductions)}
              </span>
            </div>
          </div>

          {/* Tarjeta 3: Neto a Pagar & Resumen (3 cols, valores en 1 sola línea) */}
          <div className="col-span-3 rounded border-2 border-slate-300 flex flex-col justify-between bg-slate-50/70 p-2.5">
            <div className="text-center">
              <span className="text-[9px] font-bold text-slate-700 uppercase">
                NETO A PAGAR
              </span>
              <div 
                className="font-bold tracking-tight text-lg mt-0.5"
                style={{ color: '#0f766e' }}
              >
                {formatCurrency(receipt.net_total)}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-1.5 mt-1 space-y-0.5 text-[9px] leading-normal">
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span className="text-[8.5px]">PERCEPCIONES:</span>
                <span className="text-slate-900 font-bold whitespace-nowrap">{formatCurrency(receipt.total_earnings)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span className="text-[8.5px]">DEDUCCIONES:</span>
                <span className="text-slate-900 font-bold whitespace-nowrap">{formatCurrency(receipt.total_deductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. SECCIÓN INFERIOR: INFORMACIÓN DE PAGO, VALIDACIÓN Y FIRMA */}
        <div className="border-t border-slate-200 pt-2 grid grid-cols-12 gap-3 items-center">
          {/* Información de Pago (5 cols) */}
          <div className="col-span-5 space-y-1 text-[9px]">
            <h4 className="font-bold text-slate-900 uppercase text-[8.5px]">
              INFORMACIÓN DE PAGO
            </h4>
            <div className="grid grid-cols-2 bg-slate-50 rounded border border-slate-200 p-1.5 gap-1 text-[8.5px] leading-normal">
              <div>
                <span className="text-slate-500 font-bold uppercase block text-[7.5px]">MÉTODO</span>
                <p className="font-bold text-slate-800">Depósito Bancario</p>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase block text-[7.5px]">BANCO</span>
                <p className="font-bold text-slate-800">{receipt.bank_name || person.bank_name || 'Santander'}</p>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase block text-[7.5px]">CUENTA</span>
                <p className="font-bold text-slate-800">
                  {receipt.bank_account_masked || maskBankAccount(person.bank_account_masked)}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase block text-[7.5px]">FECHA DEPÓSITO</span>
                <p className="font-bold text-slate-800">
                  {formatDate(receipt.deposit_date || receipt.payment_date, 'with_slashes')}
                </p>
              </div>
            </div>
          </div>

          {/* Validación y QR (4 cols) */}
          <div className="col-span-4 flex items-center bg-slate-50 rounded border border-slate-200 p-1.5 space-x-2">
            <div className="bg-white p-1 rounded border border-slate-200 shrink-0">
              <QRCodeSVG 
                value={qrValidationUrl} 
                size={44} 
                level="M" 
                fgColor="#0f172a" 
              />
            </div>
            <div className="text-[9px] leading-normal space-y-0.5 flex-1 min-w-0">
              <span className="font-bold text-slate-900 uppercase block text-[8.5px]">VALIDACIÓN</span>
              <p className="text-slate-600 text-[8px]">
                FOLIO: <span className="text-slate-900 font-bold font-mono">{receipt.internal_folio || 'SYSSINT-015'}</span>
              </p>
              <p className="text-slate-600 text-[8px]">
                CÓD: <span className="text-slate-900 font-bold font-mono">{receipt.verification_code}</span>
              </p>
              <div className="pt-0.5">
                <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded font-bold text-[7.5px] border ${currentStatus.color}`}>
                  {currentStatus.icon}
                  <span>{currentStatus.label}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Firma (3 cols) - Espacio libre para firma manual o imagen si fue cargada */}
          <div className="col-span-3 text-center flex flex-col items-center justify-end">
            {company.signer_signature_url ? (
              <img 
                src={company.signer_signature_url} 
                alt="Firma" 
                className="h-6 object-contain mb-0.5" 
              />
            ) : (
              <div className="h-6" />
            )}
            <div className="w-full border-t border-slate-400 pt-0.5">
              <p className="text-[9px] font-bold text-slate-900 leading-normal">
                {receipt.signer_name || company.signer_name || 'Lic. Karla Hernández López'}
              </p>
              <p className="text-[7.5px] text-slate-600 font-medium leading-normal">
                {receipt.signer_role || company.signer_role || 'Gerente de Administración'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. PIE DE PÁGINA (Footer) - Centrado y balanceado */}
      <div 
        className="px-4 py-1.5 text-[8.5px] text-white font-normal"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center leading-normal">
          {company.address && (
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-3 h-3 shrink-0" style={{ color: accentColor }} />
              <span>{company.address}</span>
            </div>
          )}

          {company.phone && (
            <div className="flex items-center space-x-1.5">
              <Phone className="w-3 h-3 shrink-0" style={{ color: accentColor }} />
              <span>{company.phone}</span>
            </div>
          )}

          {company.email && (
            <div className="flex items-center space-x-1.5">
              <Mail className="w-3 h-3 shrink-0" style={{ color: accentColor }} />
              <span>{company.email}</span>
            </div>
          )}

          {company.website && (
            <div className="flex items-center space-x-1.5">
              <Globe className="w-3 h-3 shrink-0" style={{ color: accentColor }} />
              <span>{company.website}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
