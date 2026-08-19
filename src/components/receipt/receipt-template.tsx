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
  CreditCard, 
  Building,
  Calendar,
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
      }}
    >
      {/* 1. ENCABEZADO SUPERIOR */}
      <div className="receipt-header relative flex flex-row items-stretch justify-between bg-white border-b border-slate-300 min-h-[76px]">
        {/* Bloque Izquierdo con Corte Diagonal */}
        <div 
          className="receipt-header-polygon flex-1 flex items-center px-4 py-2.5 pr-12"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center space-x-3">
            {company.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={company.name} 
                className="h-11 max-h-11 max-w-[70px] w-auto object-contain drop-shadow-sm shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-md bg-white/15 flex items-center justify-center border border-white/20 text-white shrink-0">
                <Building2 className="w-5 h-5 text-white/90" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-white font-black text-sm md:text-base tracking-wider uppercase leading-snug">
                {company.business_name || company.name || 'EMPRESA DEMO'}
              </h1>
              {company.slogan && (
                <p 
                  className="font-bold text-[10px] tracking-widest uppercase mt-0.5"
                  style={{ color: accentColor }}
                >
                  {company.slogan}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bloque Derecho: Título y Metadatos */}
        <div className="px-4 py-2 w-[320px] shrink-0 bg-white flex flex-col justify-center text-right">
          <div className="flex items-center justify-end space-x-2 mb-1">
            {copyBadge && (
              <span className="font-black uppercase text-[9px] px-2 py-0.5 rounded bg-slate-900 text-white tracking-wider shrink-0">
                {copyBadge}
              </span>
            )}
            <h2 className="font-black text-slate-900 text-sm md:text-base tracking-tight uppercase">
              {receiptTypeTitles[receipt.receipt_type] || 'RECIBO DE NÓMINA'}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-left text-[10.5px] leading-normal">
            <span className="font-extrabold text-slate-900 uppercase">FOLIO:</span>
            <span className="font-bold text-slate-900 text-right font-mono">{receipt.folio}</span>

            <span className="font-extrabold text-slate-900 uppercase">FECHA DE PAGO:</span>
            <span className="text-slate-700 font-semibold text-right">{formatDate(receipt.payment_date, 'with_slashes')}</span>

            <span className="font-extrabold text-slate-900 uppercase">PERIODO:</span>
            <span className="text-slate-700 font-semibold text-right whitespace-nowrap">
              {formatPeriod(receipt.period_start, receipt.period_end)}
            </span>

            <span className="font-extrabold text-slate-900 uppercase">NÓMINA / TIPO:</span>
            <span className="text-slate-800 font-bold uppercase text-right">
              {frequencyLabels[receipt.frequency] || 'QUINCENAL'}
            </span>
          </div>
        </div>
      </div>

      {/* CUERPO DEL RECIBO */}
      <div className="p-3.5 space-y-3">
        {/* 2. SECCIÓN DE LA PERSONA / COLABORADOR */}
        <div className="border-b border-slate-200 pb-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <h3 
              className="font-black text-xs uppercase tracking-wider"
              style={{ color: accentColor }}
            >
              {personTypeHeaders[person.person_type] || 'COLABORADOR'}
            </h3>
            {person.status === 'archived' && (
              <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">
                Archivado
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[11px] leading-normal">
            {/* Columna Izquierda */}
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="w-24 font-bold text-slate-900 uppercase shrink-0">NOMBRE:</span>
                <span className="font-bold text-slate-900 flex-1">{person.full_name || '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 font-bold text-slate-900 uppercase shrink-0">NÚMERO INT:</span>
                <span className="font-semibold text-slate-700 flex-1">{person.internal_id || '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 font-bold text-slate-900 uppercase shrink-0">PUESTO:</span>
                <span className="font-semibold text-slate-700 flex-1">{person.position || '-'}</span>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="w-24 font-bold text-slate-900 uppercase shrink-0">DEPTO:</span>
                <span className="font-semibold text-slate-700 flex-1">{person.department || '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 font-bold text-slate-900 uppercase shrink-0">R.F.C.:</span>
                <span className="font-semibold text-slate-700 flex-1">{person.rfc || '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 font-bold text-slate-900 uppercase shrink-0">RÉGIMEN:</span>
                <span className="font-semibold text-slate-700 flex-1">
                  {person.contract_type || 'Sueldos y Asimilados'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. TABLAS DE PERCEPCIONES, DEDUCCIONES Y NETO */}
        <div className="grid grid-cols-12 gap-3 items-start">
          {/* Tabla 1: Percepciones (5 cols) */}
          <div className="col-span-5 rounded border border-slate-200 overflow-hidden flex flex-col justify-between min-h-[120px]">
            <div>
              <div 
                className="text-white font-black uppercase tracking-wider px-3 py-1.5 text-[10.5px]"
                style={{ backgroundColor: '#0f766e' }}
              >
                PERCEPCIONES
              </div>
              <table className="w-full text-[10.5px] border-collapse" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                    <th className="py-1 px-2.5 text-left" style={{ width: '48%' }}>CONCEPTO</th>
                    <th className="py-1 px-1.5 text-center" style={{ width: '24%' }}>REF</th>
                    <th className="py-1 px-2.5 text-right" style={{ width: '28%' }}>IMPORTE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {earnings.map((e, idx) => (
                    <tr key={e.id || idx}>
                      <td className="py-1 px-2.5 font-medium text-slate-800">{e.concept}</td>
                      <td className="py-1 px-1.5 text-[9.5px] text-center text-slate-500">{e.reference || '-'}</td>
                      <td className="py-1 px-2.5 text-right font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrency(e.amount)}
                      </td>
                    </tr>
                  ))}
                  {earnings.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-3 text-center text-slate-400 italic text-[10px]">Sin percepciones</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 flex items-center justify-between font-black px-3 py-1.5 text-[10.5px]">
              <span className="text-slate-800 uppercase">TOTAL PERCEPCIONES</span>
              <span className="font-extrabold" style={{ color: '#0f766e' }}>
                {formatCurrency(receipt.total_earnings)}
              </span>
            </div>
          </div>

          {/* Tabla 2: Deducciones (4 cols) */}
          <div className="col-span-4 rounded border border-slate-200 overflow-hidden flex flex-col justify-between min-h-[120px]">
            <div>
              <div 
                className="text-white font-black uppercase tracking-wider px-3 py-1.5 text-[10.5px]"
                style={{ backgroundColor: secondaryColor }}
              >
                DEDUCCIONES
              </div>
              <table className="w-full text-[10.5px] border-collapse" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                    <th className="py-1 px-2 text-left" style={{ width: '44%' }}>CONCEPTO</th>
                    <th className="py-1 px-1 text-center" style={{ width: '26%' }}>REF</th>
                    <th className="py-1 px-2 text-right" style={{ width: '30%' }}>IMPORTE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deductions.map((d, idx) => (
                    <tr key={d.id || idx}>
                      <td className="py-1 px-2 font-medium text-slate-800">{d.concept}</td>
                      <td className="py-1 px-1 text-[9.5px] text-center text-slate-500 whitespace-nowrap">{d.reference || '-'}</td>
                      <td className="py-1 px-2 text-right font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrency(d.amount)}
                      </td>
                    </tr>
                  ))}
                  {deductions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-3 text-center text-slate-400 italic text-[10px]">Sin deducciones</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 flex items-center justify-between font-black px-3 py-1.5 text-[10.5px]">
              <span className="text-slate-800 uppercase">TOTAL DEDUCCIONES</span>
              <span className="font-extrabold" style={{ color: '#0f766e' }}>
                {formatCurrency(receipt.total_deductions)}
              </span>
            </div>
          </div>

          {/* Tarjeta 3: Neto a Pagar & Resumen (3 cols) */}
          <div className="col-span-3 rounded border-2 border-slate-300 flex flex-col justify-between bg-slate-50/70 p-3 min-h-[120px]">
            <div className="text-center">
              <span className="text-[10px] font-black text-slate-700 tracking-wider uppercase">
                NETO A PAGAR
              </span>
              <div 
                className="font-black tracking-tight text-xl mt-1"
                style={{ color: '#0f766e' }}
              >
                {formatCurrency(receipt.net_total)}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2 mt-1 space-y-1 text-[10px] leading-normal">
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>PERCEPCIONES:</span>
                <span className="text-slate-900 font-bold">{formatCurrency(receipt.total_earnings)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>DEDUCCIONES:</span>
                <span className="text-slate-900 font-bold">{formatCurrency(receipt.total_deductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. SECCIÓN INFERIOR: INFORMACIÓN DE PAGO, VALIDACIÓN Y FIRMA */}
        <div className="border-t border-slate-200 pt-2.5 grid grid-cols-12 gap-3 items-center">
          {/* Información de Pago (5 cols) */}
          <div className="col-span-5 space-y-1 text-[9.5px]">
            <h4 className="font-extrabold text-slate-900 uppercase text-[9.5px] tracking-wide">
              INFORMACIÓN DE PAGO
            </h4>
            <div className="grid grid-cols-2 bg-slate-50 rounded border border-slate-200 p-2 gap-1.5 text-[9.5px] leading-normal">
              <div>
                <span className="text-slate-500 font-bold uppercase block text-[8.5px]">MÉTODO</span>
                <p className="font-bold text-slate-800">Depósito Bancario</p>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase block text-[8.5px]">BANCO</span>
                <p className="font-bold text-slate-800">{receipt.bank_name || person.bank_name || 'Santander'}</p>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase block text-[8.5px]">CUENTA</span>
                <p className="font-bold text-slate-800">
                  {receipt.bank_account_masked || maskBankAccount(person.bank_account_masked)}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase block text-[8.5px]">FECHA DEPÓSITO</span>
                <p className="font-bold text-slate-800">
                  {formatDate(receipt.deposit_date || receipt.payment_date, 'with_slashes')}
                </p>
              </div>
            </div>
          </div>

          {/* Validación y QR (4 cols) */}
          <div className="col-span-4 flex items-center bg-slate-50 rounded border border-slate-200 p-2 space-x-2.5">
            <div className="bg-white p-1 rounded border border-slate-200 shrink-0">
              <QRCodeSVG 
                value={qrValidationUrl} 
                size={50} 
                level="M" 
                fgColor="#0f172a" 
              />
            </div>
            <div className="text-[10px] leading-normal space-y-0.5 flex-1 min-w-0">
              <span className="font-black text-slate-900 uppercase block text-[9.5px]">VALIDACIÓN</span>
              <p className="text-slate-600 text-[9px]">
                FOLIO: <span className="text-slate-900 font-bold font-mono">{receipt.internal_folio || 'SYSSINT-015'}</span>
              </p>
              <p className="text-slate-600 text-[9px]">
                CÓD: <span className="text-slate-900 font-bold font-mono">{receipt.verification_code}</span>
              </p>
              <div className="pt-0.5">
                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded font-extrabold text-[8.5px] border ${currentStatus.color}`}>
                  {currentStatus.icon}
                  <span>{currentStatus.label}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Firma (3 cols) */}
          <div className="col-span-3 text-center flex flex-col items-center justify-center">
            {company.signer_signature_url ? (
              <img 
                src={company.signer_signature_url} 
                alt="Firma" 
                className="h-7 object-contain mb-0.5" 
              />
            ) : (
              <div className="h-6 text-sm flex items-center justify-center text-slate-700 italic font-serif">
                {company.signer_name ? company.signer_name.split(' ')[1] || 'Firma' : 'Lic. Karla Hdez'}
              </div>
            )}
            <div className="w-full border-t border-slate-400 pt-1">
              <p className="text-[10px] font-bold text-slate-900 leading-normal">
                {receipt.signer_name || company.signer_name || 'Lic. Karla Hernández López'}
              </p>
              <p className="text-[8.5px] text-slate-600 font-medium leading-normal">
                {receipt.signer_role || company.signer_role || 'Gerente de Administración'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. PIE DE PÁGINA (Footer) */}
      <div 
        className="px-4 py-2 text-[9.5px] text-white font-medium"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="grid grid-cols-4 gap-2 text-left items-center leading-normal">
          {company.address && (
            <div className="flex items-center space-x-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
              <span className="truncate">{company.address}</span>
            </div>
          )}

          {company.phone && (
            <div className="flex items-center space-x-1.5 truncate">
              <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
              <span className="truncate">{company.phone}</span>
            </div>
          )}

          {company.email && (
            <div className="flex items-center space-x-1.5 truncate">
              <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
              <span className="truncate">{company.email}</span>
            </div>
          )}

          {company.website && (
            <div className="flex items-center space-x-1.5 truncate">
              <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
              <span className="truncate">{company.website}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
