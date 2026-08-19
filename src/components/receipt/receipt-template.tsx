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

interface ReceiptTemplateProps {
  receipt: Receipt;
  companyOverride?: Partial<Company>;
  personOverride?: Partial<Person>;
  scale?: number;
  className?: string;
  isPrintMode?: boolean;
}

export const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({
  receipt,
  companyOverride,
  personOverride,
  scale = 1,
  className = '',
  isPrintMode = false,
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
    draft: { label: 'BORRADOR', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
    authorized: { label: 'AUTORIZADO', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    paid: { label: 'PAGADO', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    cancelled: { label: 'CANCELADO', color: 'text-rose-600 bg-rose-50 border-rose-200', icon: <Ban className="w-3.5 h-3.5" /> },
  };

  const currentStatus = statusBadges[receipt.status] || statusBadges.draft;

  return (
    <div 
      className={`receipt-sheet bg-white text-slate-800 shadow-xl print:shadow-none border border-slate-200 print:border-none rounded-xl print:rounded-none overflow-hidden mx-auto font-sans transition-transform origin-top ${className}`}
      style={{
        width: '100%',
        maxWidth: isPrintMode ? '100%' : '1050px',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
      }}
    >
      {/* 1. ENCABEZADO SUPERIOR */}
      <div className="receipt-header relative flex flex-col md:flex-row items-stretch justify-between bg-white border-b border-slate-200 min-h-[125px]">
        {/* Bloque Izquierdo con Corte Diagonal */}
        <div 
          className="receipt-header-polygon flex-1 flex items-center px-6 py-4 md:pr-14"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center space-x-4">
            {company.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={company.name} 
                className="h-20 w-auto max-h-20 max-w-[85px] object-contain drop-shadow-md shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 text-white shrink-0">
                <Building2 className="w-8 h-8 text-white/90" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-white text-lg md:text-xl font-black tracking-wider uppercase leading-tight">
                {company.business_name || company.name || 'EMPRESA DEMO'}
              </h1>
              {company.slogan && (
                <p 
                  className="text-xs md:text-sm font-bold tracking-widest uppercase mt-1"
                  style={{ color: accentColor }}
                >
                  {company.slogan}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bloque Derecho: Título y Metadatos */}
        <div className="px-6 py-3 flex flex-col justify-center text-right md:w-[360px] shrink-0 bg-white">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">
            {receiptTypeTitles[receipt.receipt_type] || 'RECIBO DE PAGO'}
          </h2>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-left">
            <span className="font-extrabold text-slate-900 uppercase">FOLIO:</span>
            <span className="font-bold text-slate-800 text-right">{receipt.folio}</span>

            <span className="font-extrabold text-slate-900 uppercase">FECHA DE PAGO:</span>
            <span className="text-slate-700 font-semibold text-right">{formatDate(receipt.payment_date, 'with_slashes')}</span>

            <span className="font-extrabold text-slate-900 uppercase">PERIODO:</span>
            <span className="text-slate-700 font-semibold text-right text-[11px] whitespace-nowrap">
              {formatPeriod(receipt.period_start, receipt.period_end)}
            </span>

            <span className="font-extrabold text-slate-900 uppercase">NÓMINA / TIPO:</span>
            <span className="text-slate-800 font-bold uppercase text-right">
              {frequencyLabels[receipt.frequency] || 'QUINCENAL'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-7 space-y-5">
        {/* 2. SECCIÓN DE LA PERSONA / COLABORADOR */}
        <div className="border-b-2 pb-3" style={{ borderColor: accentColor }}>
          <div className="flex items-center justify-between mb-2">
            <h3 
              className="text-sm font-black uppercase tracking-wider"
              style={{ color: accentColor }}
            >
              {personTypeHeaders[person.person_type] || 'COLABORADOR'}
            </h3>
            {person.status === 'archived' && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">
                Archivado
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
            {/* Columna Izquierda */}
            <div className="space-y-1.5">
              <div className="flex items-baseline">
                <span className="w-36 font-extrabold text-slate-900 uppercase">NOMBRE:</span>
                <span className="font-bold text-slate-800 flex-1">{person.full_name || '-'}</span>
              </div>
              <div className="flex items-baseline">
                <span className="w-36 font-extrabold text-slate-900 uppercase">NÚMERO INTERNO:</span>
                <span className="font-semibold text-slate-700 flex-1">{person.internal_id || '-'}</span>
              </div>
              <div className="flex items-baseline">
                <span className="w-36 font-extrabold text-slate-900 uppercase">PUESTO:</span>
                <span className="font-semibold text-slate-700 flex-1">{person.position || '-'}</span>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-1.5">
              <div className="flex items-baseline">
                <span className="w-36 font-extrabold text-slate-900 uppercase">DEPARTAMENTO:</span>
                <span className="font-semibold text-slate-700 flex-1">{person.department || '-'}</span>
              </div>
              <div className="flex items-baseline">
                <span className="w-36 font-extrabold text-slate-900 uppercase">R.F.C.:</span>
                <span className="font-semibold text-slate-700 flex-1">{person.rfc || '-'}</span>
              </div>
              <div className="flex items-baseline">
                <span className="w-36 font-extrabold text-slate-900 uppercase">RÉGIMEN:</span>
                <span className="font-semibold text-slate-700 flex-1 text-[11px] leading-tight">
                  {person.contract_type || 'Sueldos y Salarios e Ingresos Asimilados a Salarios'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. TABLAS DE PERCEPCIONES, DEDUCCIONES Y NETO (3 Columnas) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Tabla 1: Percepciones (5 cols) */}
          <div className="lg:col-span-5 rounded-lg border border-slate-200 overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div>
              <div 
                className="px-3 py-1.5 text-white font-black text-xs uppercase tracking-wider"
                style={{ backgroundColor: '#0f766e' }}
              >
                PERCEPCIONES
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                    <th className="py-1.5 px-3 text-left">CONCEPTO</th>
                    <th className="py-1.5 px-2 text-center">REFERENCIA</th>
                    <th className="py-1.5 px-3 text-right">IMPORTE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {earnings.map((e, idx) => (
                    <tr key={e.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-1.5 px-3 font-medium text-slate-800">{e.concept}</td>
                      <td className="py-1.5 px-2 text-center text-slate-500 text-[11px]">{e.reference || '-'}</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                        {formatCurrency(e.amount)}
                      </td>
                    </tr>
                  ))}
                  {earnings.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400 italic">Sin percepciones</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex items-center justify-between font-black text-xs">
              <span className="text-slate-800 uppercase">TOTAL PERCEPCIONES</span>
              <span className="font-extrabold text-sm" style={{ color: '#0f766e' }}>
                {formatCurrency(receipt.total_earnings)}
              </span>
            </div>
          </div>

          {/* Tabla 2: Deducciones (4 cols) */}
          <div className="lg:col-span-4 rounded-lg border border-slate-200 overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div>
              <div 
                className="px-3 py-1.5 text-white font-black text-xs uppercase tracking-wider"
                style={{ backgroundColor: secondaryColor }}
              >
                DEDUCCIONES
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                    <th className="py-1.5 px-3 text-left">CONCEPTO</th>
                    <th className="py-1.5 px-2 text-center">REFERENCIA</th>
                    <th className="py-1.5 px-3 text-right">IMPORTE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deductions.map((d, idx) => (
                    <tr key={d.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-1.5 px-3 font-medium text-slate-800">{d.concept}</td>
                      <td className="py-1.5 px-2 text-center text-slate-500 text-[11px]">{d.reference || '-'}</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                        {formatCurrency(d.amount)}
                      </td>
                    </tr>
                  ))}
                  {deductions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400 italic">Sin deducciones</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex items-center justify-between font-black text-xs">
              <span className="text-slate-800 uppercase">TOTAL DEDUCCIONES</span>
              <span className="font-extrabold text-sm" style={{ color: '#0f766e' }}>
                {formatCurrency(receipt.total_deductions)}
              </span>
            </div>
          </div>

          {/* Tarjeta 3: Neto a Pagar & Resumen (3 cols) */}
          <div className="lg:col-span-3 rounded-lg border-2 border-slate-300 p-4 flex flex-col justify-between bg-slate-50/70 min-h-[220px]">
            <div className="text-center pt-2">
              <span className="text-xs font-black text-slate-700 tracking-wider uppercase">
                NETO A PAGAR
              </span>
              <div 
                className="text-2xl md:text-3xl font-black mt-2 tracking-tight"
                style={{ color: '#0f766e' }}
              >
                {formatCurrency(receipt.net_total)}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 mt-4 space-y-1.5 text-xs">
              <span className="font-black text-slate-800 uppercase text-[11px] block mb-1">
                RESUMEN
              </span>
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>TOTAL PERCEPCIONES</span>
                <span className="text-slate-800">{formatCurrency(receipt.total_earnings)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>TOTAL DEDUCCIONES</span>
                <span className="text-slate-800">{formatCurrency(receipt.total_deductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. SECCIÓN INFERIOR: INFORMACIÓN DE PAGO, VALIDACIÓN Y FIRMA */}
        <div className="border-t border-slate-200 pt-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Información de Pago (5 cols) */}
          <div className="md:col-span-5 space-y-2 text-xs">
            <h4 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wide">
              INFORMACIÓN DE PAGO
            </h4>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div>
                <div className="flex items-center text-slate-500 text-[10px] font-bold uppercase space-x-1">
                  <CreditCard className="w-3 h-3 text-cyan-600" />
                  <span>MÉTODO</span>
                </div>
                <p className="font-bold text-slate-800 text-[11px] mt-0.5">Depósito Bancario</p>
              </div>

              <div>
                <div className="flex items-center text-slate-500 text-[10px] font-bold uppercase space-x-1">
                  <Building className="w-3 h-3 text-cyan-600" />
                  <span>BANCO</span>
                </div>
                <p className="font-bold text-slate-800 text-[11px] mt-0.5">{receipt.bank_name || person.bank_name || 'Santander'}</p>
              </div>

              <div>
                <div className="flex items-center text-slate-500 text-[10px] font-bold uppercase space-x-1">
                  <CreditCard className="w-3 h-3 text-cyan-600" />
                  <span>CUENTA</span>
                </div>
                <p className="font-bold text-slate-800 text-[11px] mt-0.5">
                  {receipt.bank_account_masked || maskBankAccount(person.bank_account_masked)}
                </p>
              </div>

              <div>
                <div className="flex items-center text-slate-500 text-[10px] font-bold uppercase space-x-1">
                  <Calendar className="w-3 h-3 text-cyan-600" />
                  <span>FECHA DEPÓSITO</span>
                </div>
                <p className="font-bold text-slate-800 text-[11px] mt-0.5">
                  {formatDate(receipt.deposit_date || receipt.payment_date, 'with_slashes')}
                </p>
              </div>
            </div>
          </div>

          {/* Validación y QR (4 cols) */}
          <div className="md:col-span-4 flex items-center space-x-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div className="bg-white p-1.5 rounded border border-slate-200 shrink-0">
              <QRCodeSVG 
                value={qrValidationUrl} 
                size={62} 
                level="M" 
                fgColor="#0f172a" 
              />
            </div>
            <div className="text-[10px] space-y-0.5 flex-1 min-w-0">
              <span className="font-black text-slate-900 uppercase block text-[11px]">VALIDACIÓN</span>
              <p className="text-slate-500 font-semibold">
                FOLIO INTERNO: <span className="text-slate-800 font-bold">{receipt.internal_folio || 'SYSSINT-015-0789'}</span>
              </p>
              <p className="text-slate-500 font-semibold truncate">
                CÓDIGO: <span className="text-slate-800 font-bold font-mono">{receipt.verification_code}</span>
              </p>
              <div className="pt-0.5">
                <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded font-extrabold text-[10px] border ${currentStatus.color}`}>
                  {currentStatus.icon}
                  <span>{currentStatus.label}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Firma (3 cols) */}
          <div className="md:col-span-3 text-center flex flex-col items-center justify-center">
            {company.signer_signature_url ? (
              <img 
                src={company.signer_signature_url} 
                alt="Firma" 
                className="h-10 object-contain mb-1" 
              />
            ) : (
              <div className="h-9 flex items-center justify-center text-slate-700 italic font-serif text-lg tracking-wider">
                {company.signer_name ? company.signer_name.split(' ')[1] || 'Firma' : 'Lic. Karla Hdez'}
              </div>
            )}
            <div className="w-full border-t border-slate-400 pt-1">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {receipt.signer_name || company.signer_name || 'Lic. Karla Hernández López'}
              </p>
              <p className="text-[10px] text-slate-600 font-medium">
                {receipt.signer_role || company.signer_role || 'Gerente de Administración'}
              </p>
            </div>
          </div>
        </div>

        {/* Aviso Legal de Comprobante Administrativo */}
        <p className="text-[10px] text-slate-500 italic text-center pt-1 border-t border-slate-100">
          {company.legal_disclaimer || 'Este documento es un comprobante administrativo interno y no sustituye un CFDI de nómina timbrado.'}
        </p>
      </div>

      {/* 5. PIE DE PÁGINA (Footer) */}
      <div 
        className="px-6 py-3 text-white text-[11px] font-medium"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-center md:text-left items-center">
          {company.address && (
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
              <span className="truncate">{company.address}</span>
            </div>
          )}

          {company.phone && (
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
              <span>{company.phone}</span>
            </div>
          )}

          {company.email && (
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
              <span className="truncate">{company.email}</span>
            </div>
          )}

          {company.website && (
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
              <span className="truncate">{company.website}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
