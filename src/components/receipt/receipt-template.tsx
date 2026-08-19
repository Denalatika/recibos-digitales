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
  isCompact?: boolean;
  copyBadge?: string;
}

export const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({
  receipt,
  companyOverride,
  personOverride,
  scale = 1,
  className = '',
  isPrintMode = false,
  isCompact = false,
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
    draft: { label: 'BORRADOR', color: 'text-amber-700 bg-amber-50 border-amber-300', icon: <Clock className={isCompact ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} /> },
    authorized: { label: 'AUTORIZADO', color: 'text-blue-700 bg-blue-50 border-blue-300', icon: <ShieldCheck className={isCompact ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} /> },
    paid: { label: 'PAGADO', color: 'text-emerald-700 bg-emerald-50 border-emerald-300', icon: <CheckCircle2 className={isCompact ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} /> },
    cancelled: { label: 'CANCELADO', color: 'text-rose-700 bg-rose-50 border-rose-300', icon: <Ban className={isCompact ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} /> },
  };

  const currentStatus = statusBadges[receipt.status] || statusBadges.draft;

  return (
    <div 
      className={`receipt-sheet bg-white text-slate-800 shadow-md print:shadow-none border border-slate-300 print:border-slate-400 rounded-lg print:rounded-none overflow-hidden mx-auto font-sans transition-transform origin-top w-full ${className}`}
      style={{
        width: '100%',
        maxWidth: isPrintMode ? '100%' : isCompact ? '100%' : '1050px',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
      }}
    >
      {/* 1. ENCABEZADO SUPERIOR */}
      <div className={`receipt-header relative flex flex-row items-stretch justify-between bg-white border-b border-slate-300 ${
        isCompact ? 'min-h-[70px] print:min-h-[65px]' : 'min-h-[110px] print:min-h-[100px]'
      }`}>
        {/* Bloque Izquierdo con Corte Diagonal */}
        <div 
          className={`receipt-header-polygon flex-1 flex items-center ${
            isCompact 
              ? 'px-3 py-1.5 pr-8 print:px-3 print:py-1.5 print:pr-8' 
              : 'px-6 py-4 pr-14 print:px-5 print:py-3 print:pr-12'
          }`}
          style={{ backgroundColor: primaryColor }}
        >
          <div className={`flex items-center ${isCompact ? 'space-x-2.5' : 'space-x-4'}`}>
            {company.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={company.name} 
                className={`${
                  isCompact ? 'h-9 max-h-9 max-w-[55px]' : 'h-16 md:h-20 print:h-16 max-h-20 max-w-[85px]'
                } w-auto object-contain drop-shadow-sm shrink-0`}
              />
            ) : (
              <div className={`${
                isCompact ? 'w-8 h-8' : 'w-12 h-12 md:w-14 md:h-14 print:w-12 print:h-12'
              } rounded-md bg-white/15 flex items-center justify-center border border-white/20 text-white shrink-0`}>
                <Building2 className={`${isCompact ? 'w-5 h-5' : 'w-7 h-7 md:w-8 md:h-8 print:w-7 print:h-7'} text-white/90`} />
              </div>
            )}
            <div className="min-w-0">
              <h1 className={`text-white font-black tracking-wider uppercase leading-tight ${
                isCompact ? 'text-xs md:text-sm print:text-xs' : 'text-base md:text-xl print:text-lg'
              }`}>
                {company.business_name || company.name || 'EMPRESA DEMO'}
              </h1>
              {company.slogan && (
                <p 
                  className={`font-bold tracking-widest uppercase mt-0.5 ${
                    isCompact ? 'text-[8px] print:text-[8px]' : 'text-xs md:text-sm print:text-xs'
                  }`}
                  style={{ color: accentColor }}
                >
                  {company.slogan}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bloque Derecho: Título y Metadatos */}
        <div className={`flex flex-col justify-center text-right shrink-0 bg-white ${
          isCompact 
            ? 'px-3 py-1.5 w-[260px] sm:w-[280px] print:w-[270px]' 
            : 'px-6 py-3 print:px-5 print:py-2.5 w-[320px] md:w-[360px] print:w-[350px]'
        }`}>
          <div className="flex items-center justify-end space-x-1.5 mb-0.5">
            {copyBadge && (
              <span className={`font-black uppercase rounded bg-slate-900 text-white tracking-wider ${
                isCompact ? 'text-[8px] px-1.5 py-0.2' : 'text-[10px] px-2 py-0.5'
              }`}>
                {copyBadge}
              </span>
            )}
            <h2 className={`font-black text-slate-900 tracking-tight uppercase ${
              isCompact ? 'text-xs sm:text-sm print:text-xs' : 'text-lg md:text-2xl print:text-xl'
            }`}>
              {receiptTypeTitles[receipt.receipt_type] || 'RECIBO DE PAGO'}
            </h2>
          </div>

          <div className={`grid grid-cols-2 gap-x-2 text-left leading-tight ${
            isCompact ? 'text-[8.5px] print:text-[8.5px] gap-y-0.5' : 'text-xs print:text-[11px] gap-y-0.5'
          }`}>
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

      <div className={`${isCompact ? 'p-2 sm:p-2.5 print:p-2 space-y-1.5 print:space-y-1.5' : 'p-5 md:p-6 print:p-4 space-y-4 print:space-y-3'}`}>
        {/* 2. SECCIÓN DE LA PERSONA / COLABORADOR */}
        <div className={`border-b ${isCompact ? 'pb-1 border-slate-200' : 'pb-2.5 print:pb-2 border-b-2'}`} style={!isCompact ? { borderColor: accentColor } : undefined}>
          <div className="flex items-center justify-between mb-0.5">
            <h3 
              className={`font-black uppercase tracking-wider ${isCompact ? 'text-[9.5px]' : 'text-xs md:text-sm print:text-xs'}`}
              style={{ color: accentColor }}
            >
              {personTypeHeaders[person.person_type] || 'COLABORADOR'}
            </h3>
            {person.status === 'archived' && (
              <span className="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-medium">
                Archivado
              </span>
            )}
          </div>

          <div className={`grid grid-cols-2 gap-x-4 ${
            isCompact ? 'gap-y-0.5 text-[8.5px] print:text-[8.5px] leading-tight' : 'gap-y-1.5 print:gap-y-1 text-xs print:text-[11px]'
          }`}>
            {/* Columna Izquierda */}
            <div className="space-y-0.5">
              <div className="flex items-baseline">
                <span className={`${isCompact ? 'w-20 sm:w-24' : 'w-32 md:w-36 print:w-32'} font-extrabold text-slate-900 uppercase`}>NOMBRE:</span>
                <span className="font-bold text-slate-900 flex-1 truncate">{person.full_name || '-'}</span>
              </div>
              <div className="flex items-baseline">
                <span className={`${isCompact ? 'w-20 sm:w-24' : 'w-32 md:w-36 print:w-32'} font-extrabold text-slate-900 uppercase`}>NÚMERO INT:</span>
                <span className="font-semibold text-slate-700 flex-1">{person.internal_id || '-'}</span>
              </div>
              <div className="flex items-baseline">
                <span className={`${isCompact ? 'w-20 sm:w-24' : 'w-32 md:w-36 print:w-32'} font-extrabold text-slate-900 uppercase`}>PUESTO:</span>
                <span className="font-semibold text-slate-700 flex-1 truncate">{person.position || '-'}</span>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-0.5">
              <div className="flex items-baseline">
                <span className={`${isCompact ? 'w-20 sm:w-24' : 'w-32 md:w-36 print:w-32'} font-extrabold text-slate-900 uppercase`}>DEPTO:</span>
                <span className="font-semibold text-slate-700 flex-1 truncate">{person.department || '-'}</span>
              </div>
              <div className="flex items-baseline">
                <span className={`${isCompact ? 'w-20 sm:w-24' : 'w-32 md:w-36 print:w-32'} font-extrabold text-slate-900 uppercase`}>R.F.C.:</span>
                <span className="font-semibold text-slate-700 flex-1">{person.rfc || '-'}</span>
              </div>
              <div className="flex items-baseline">
                <span className={`${isCompact ? 'w-20 sm:w-24' : 'w-32 md:w-36 print:w-32'} font-extrabold text-slate-900 uppercase`}>RÉGIMEN:</span>
                <span className="font-semibold text-slate-700 flex-1 truncate">
                  {person.contract_type || 'Sueldos y Asimilados'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. TABLAS DE PERCEPCIONES, DEDUCCIONES Y NETO (3 Columnas) */}
        <div className={`grid grid-cols-12 ${isCompact ? 'gap-1.5 print:gap-1.5' : 'gap-3.5 print:gap-3'} items-start`}>
          {/* Tabla 1: Percepciones (5 cols) */}
          <div className={`col-span-5 rounded border border-slate-200 overflow-hidden flex flex-col justify-between ${
            isCompact ? 'min-h-[85px] print:min-h-[85px]' : 'min-h-[170px] print:min-h-[150px]'
          }`}>
            <div>
              <div 
                className={`text-white font-black uppercase tracking-wider ${
                  isCompact ? 'px-2 py-0.5 text-[8.5px] leading-tight' : 'px-3 py-1 text-xs print:text-[11px]'
                }`}
                style={{ backgroundColor: '#0f766e' }}
              >
                PERCEPCIONES
              </div>
              <table className={`w-full ${isCompact ? 'text-[8px] print:text-[8px]' : 'text-xs print:text-[11px]'}`}>
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                    <th className={`${isCompact ? 'py-0.5 px-1.5' : 'py-1 px-2.5'} text-left`}>CONCEPTO</th>
                    <th className={`${isCompact ? 'py-0.5 px-1' : 'py-1 px-1.5'} text-center`}>REF</th>
                    <th className={`${isCompact ? 'py-0.5 px-1.5' : 'py-1 px-2.5'} text-right`}>IMPORTE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {earnings.map((e, idx) => (
                    <tr key={e.id || idx}>
                      <td className={`${isCompact ? 'py-0.2 px-1.5' : 'py-1 px-2.5'} font-medium text-slate-800 truncate max-w-[120px]`}>{e.concept}</td>
                      <td className={`${isCompact ? 'py-0.2 px-1 text-[7.5px]' : 'py-1 px-1.5 text-[10px]'} text-center text-slate-500`}>{e.reference || '-'}</td>
                      <td className={`${isCompact ? 'py-0.2 px-1.5' : 'py-1 px-2.5'} text-right font-semibold text-slate-800 whitespace-nowrap`}>
                        {formatCurrency(e.amount)}
                      </td>
                    </tr>
                  ))}
                  {earnings.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-1 text-center text-slate-400 italic text-[8px]">Sin percepciones</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={`bg-slate-50 border-t border-slate-200 flex items-center justify-between font-black ${
              isCompact ? 'px-1.5 py-0.5 text-[8.5px]' : 'px-3 py-1.5 text-xs print:text-[11px]'
            }`}>
              <span className="text-slate-800 uppercase">TOTAL PERC.</span>
              <span className="font-extrabold" style={{ color: '#0f766e' }}>
                {formatCurrency(receipt.total_earnings)}
              </span>
            </div>
          </div>

          {/* Tabla 2: Deducciones (4 cols) */}
          <div className={`col-span-4 rounded border border-slate-200 overflow-hidden flex flex-col justify-between ${
            isCompact ? 'min-h-[85px] print:min-h-[85px]' : 'min-h-[170px] print:min-h-[150px]'
          }`}>
            <div>
              <div 
                className={`text-white font-black uppercase tracking-wider ${
                  isCompact ? 'px-2 py-0.5 text-[8.5px] leading-tight' : 'px-3 py-1 text-xs print:text-[11px]'
                }`}
                style={{ backgroundColor: secondaryColor }}
              >
                DEDUCCIONES
              </div>
              <table className={`w-full ${isCompact ? 'text-[8px] print:text-[8px]' : 'text-xs print:text-[11px]'}`}>
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                    <th className={`${isCompact ? 'py-0.5 px-1.5' : 'py-1 px-2.5'} text-left`}>CONCEPTO</th>
                    <th className={`${isCompact ? 'py-0.5 px-1' : 'py-1 px-1.5'} text-center`}>REF</th>
                    <th className={`${isCompact ? 'py-0.5 px-1.5' : 'py-1 px-2.5'} text-right`}>IMPORTE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deductions.map((d, idx) => (
                    <tr key={d.id || idx}>
                      <td className={`${isCompact ? 'py-0.2 px-1.5' : 'py-1 px-2.5'} font-medium text-slate-800 truncate max-w-[100px]`}>{d.concept}</td>
                      <td className={`${isCompact ? 'py-0.2 px-1 text-[7.5px]' : 'py-1 px-1.5 text-[10px]'} text-center text-slate-500`}>{d.reference || '-'}</td>
                      <td className={`${isCompact ? 'py-0.2 px-1.5' : 'py-1 px-2.5'} text-right font-semibold text-slate-800 whitespace-nowrap`}>
                        {formatCurrency(d.amount)}
                      </td>
                    </tr>
                  ))}
                  {deductions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-1 text-center text-slate-400 italic text-[8px]">Sin deducciones</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={`bg-slate-50 border-t border-slate-200 flex items-center justify-between font-black ${
              isCompact ? 'px-1.5 py-0.5 text-[8.5px]' : 'px-3 py-1.5 text-xs print:text-[11px]'
            }`}>
              <span className="text-slate-800 uppercase">TOTAL DED.</span>
              <span className="font-extrabold" style={{ color: '#0f766e' }}>
                {formatCurrency(receipt.total_deductions)}
              </span>
            </div>
          </div>

          {/* Tarjeta 3: Neto a Pagar & Resumen (3 cols) */}
          <div className={`col-span-3 rounded border-2 border-slate-300 flex flex-col justify-between bg-slate-50/70 ${
            isCompact ? 'p-1.5 min-h-[85px] print:min-h-[85px]' : 'p-3 print:p-2.5 min-h-[170px] print:min-h-[150px]'
          }`}>
            <div className="text-center">
              <span className="text-[8px] font-black text-slate-700 tracking-wider uppercase">
                NETO A PAGAR
              </span>
              <div 
                className={`font-black tracking-tight ${isCompact ? 'text-sm sm:text-base print:text-sm mt-0.5' : 'text-xl md:text-2xl print:text-xl mt-1'}`}
                style={{ color: '#0f766e' }}
              >
                {formatCurrency(receipt.net_total)}
              </div>
            </div>

            <div className={`border-t border-slate-200 ${isCompact ? 'pt-0.5 mt-0.5 space-y-0.2 text-[8px]' : 'pt-2 mt-2 space-y-1 text-xs print:text-[10px]'}`}>
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>PERC:</span>
                <span className="text-slate-800">{formatCurrency(receipt.total_earnings)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>DED:</span>
                <span className="text-slate-800">{formatCurrency(receipt.total_deductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. SECCIÓN INFERIOR: INFORMACIÓN DE PAGO, VALIDACIÓN Y FIRMA */}
        <div className={`border-t border-slate-200 grid grid-cols-12 items-center ${
          isCompact ? 'pt-1 gap-1.5' : 'pt-3 print:pt-2.5 gap-4 print:gap-3'
        }`}>
          {/* Información de Pago (5 cols) */}
          <div className={`col-span-5 ${isCompact ? 'space-y-0.5 text-[8px]' : 'space-y-1 text-xs print:text-[10px]'}`}>
            <h4 className="font-extrabold text-slate-900 uppercase text-[8px] tracking-wide">
              INFORMACIÓN DE PAGO
            </h4>
            <div className={`grid grid-cols-2 bg-slate-50 rounded border border-slate-200 ${isCompact ? 'p-1 gap-0.5 text-[7.5px]' : 'p-2 gap-1.5'}`}>
              <div>
                <span className="text-slate-500 font-bold uppercase block text-[7px]">MÉTODO</span>
                <p className="font-bold text-slate-800 truncate">Depósito</p>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase block text-[7px]">BANCO</span>
                <p className="font-bold text-slate-800 truncate">{receipt.bank_name || person.bank_name || 'Santander'}</p>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase block text-[7px]">CUENTA</span>
                <p className="font-bold text-slate-800 truncate">
                  {receipt.bank_account_masked || maskBankAccount(person.bank_account_masked)}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase block text-[7px]">FECHA DEP.</span>
                <p className="font-bold text-slate-800 truncate">
                  {formatDate(receipt.deposit_date || receipt.payment_date, 'with_slashes')}
                </p>
              </div>
            </div>
          </div>

          {/* Validación y QR (4 cols) */}
          <div className={`col-span-4 flex items-center bg-slate-50 rounded border border-slate-200 ${
            isCompact ? 'p-1 space-x-1.5' : 'p-2 space-x-2.5'
          }`}>
            <div className="bg-white p-0.5 rounded border border-slate-200 shrink-0">
              <QRCodeSVG 
                value={qrValidationUrl} 
                size={isCompact ? 34 : 54} 
                level="M" 
                fgColor="#0f172a" 
              />
            </div>
            <div className="text-[7.5px] leading-tight space-y-0.2 flex-1 min-w-0">
              <span className="font-black text-slate-900 uppercase block text-[7.5px]">VALIDACIÓN</span>
              <p className="text-slate-500 truncate text-[7px]">
                FOLIO: <span className="text-slate-800 font-bold">{receipt.internal_folio || 'SYSS-015'}</span>
              </p>
              <p className="text-slate-500 truncate text-[7px]">
                CÓD: <span className="text-slate-800 font-bold font-mono">{receipt.verification_code}</span>
              </p>
              <div className="pt-0.2">
                <span className={`inline-flex items-center space-x-0.5 px-1 py-0.1 rounded font-extrabold text-[7px] border ${currentStatus.color}`}>
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
                className={`${isCompact ? 'h-4' : 'h-8'} object-contain mb-0.2`} 
              />
            ) : (
              <div className={`${isCompact ? 'h-3.5 text-xs' : 'h-7 text-base'} flex items-center justify-center text-slate-700 italic font-serif`}>
                {company.signer_name ? company.signer_name.split(' ')[1] || 'Firma' : 'Lic. Karla Hdez'}
              </div>
            )}
            <div className="w-full border-t border-slate-400 pt-0.2">
              <p className="text-[8px] font-bold text-slate-900 leading-none truncate">
                {receipt.signer_name || company.signer_name || 'Lic. Karla Hernández'}
              </p>
              <p className="text-[7px] text-slate-600 font-medium leading-none truncate">
                {receipt.signer_role || company.signer_role || 'Gerente Admin.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. PIE DE PÁGINA (Footer) */}
      <div 
        className={`${isCompact ? 'px-3 py-1 text-[7.5px]' : 'px-5 py-2.5 print:px-4 print:py-2 text-[10px]'} text-white font-medium`}
        style={{ backgroundColor: primaryColor }}
      >
        <div className="grid grid-cols-4 gap-1 text-left items-center leading-none">
          {company.address && (
            <div className="flex items-center space-x-1 truncate">
              <MapPin className="w-2.5 h-2.5 shrink-0" style={{ color: accentColor }} />
              <span className="truncate">{company.address}</span>
            </div>
          )}

          {company.phone && (
            <div className="flex items-center space-x-1 truncate">
              <Phone className="w-2.5 h-2.5 shrink-0" style={{ color: accentColor }} />
              <span className="truncate">{company.phone}</span>
            </div>
          )}

          {company.email && (
            <div className="flex items-center space-x-1 truncate">
              <Mail className="w-2.5 h-2.5 shrink-0" style={{ color: accentColor }} />
              <span className="truncate">{company.email}</span>
            </div>
          )}

          {company.website && (
            <div className="flex items-center space-x-1 truncate">
              <Globe className="w-2.5 h-2.5 shrink-0" style={{ color: accentColor }} />
              <span className="truncate">{company.website}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
