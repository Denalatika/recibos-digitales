'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Printer, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  FileText,
  UserPlus
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { ReceiptTemplate } from '@/components/receipt/receipt-template';
import { ImageUploader } from '@/components/ui/image-uploader';
import { QuickAddPersonModal } from '@/components/people/quick-add-person-modal';
import { useApp } from '@/context/app-context';
import { calculateTotals, formatCurrency, generateVerificationCode } from '@/lib/utils';
import { downloadReceiptAsPdf } from '@/lib/pdf-generator';
import { 
  Receipt, 
  ReceiptType, 
  ReceiptFrequency, 
  ReceiptStatus, 
  PaymentMethod,
  ReceiptEarning,
  ReceiptDeduction
} from '@/types/database';

function NewReceiptForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeCompany, activeCompanyPeople, addReceipt } = useApp();

  const selectedPersonDefault = activeCompanyPeople[0] || null;

  // Estado del Formulario
  const [personId, setPersonId] = useState<string>(selectedPersonDefault?.id || '');
  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false);
  const [receiptType, setReceiptType] = useState<ReceiptType>('payroll');
  const [frequency, setFrequency] = useState<ReceiptFrequency>('biweekly');
  const [status, setStatus] = useState<ReceiptStatus>('draft');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [periodStart, setPeriodStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [periodEnd, setPeriodEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [bankName, setBankName] = useState<string>(selectedPersonDefault?.bank_name || 'Santander');
  const [bankAccountMasked, setBankAccountMasked] = useState<string>(selectedPersonDefault?.bank_account_masked || '•••• 6712');
  
  const [signerName, setSignerName] = useState<string>(activeCompany?.signer_name || 'Lic. Karla Hernández López');
  const [signerRole, setSignerRole] = useState<string>(activeCompany?.signer_role || 'Gerente de Administración');
  const [signerSignatureUrl, setSignerSignatureUrl] = useState<string>(activeCompany?.signer_signature_url || '');
  const [notes, setNotes] = useState<string>('Pago quincenal ordinario correspondiente al periodo actual.');

  // Percepciones Dinámicas
  const [earnings, setEarnings] = useState<ReceiptEarning[]>([
    { id: '1', concept: 'Sueldo Base', reference: '15.00 días', amount: 14000.00, display_order: 1 },
    { id: '2', concept: 'Bonificación por Desempeño', reference: 'Quincenal', amount: 2800.00, display_order: 2 },
    { id: '3', concept: 'Vales de Despensa', reference: 'Evento', amount: 700.00, display_order: 3 },
    { id: '4', concept: 'Ayuda de Transporte', reference: 'Evento', amount: 500.00, display_order: 4 },
  ]);

  // Deducciones Dinámicas
  const [deductions, setDeductions] = useState<ReceiptDeduction[]>([
    { id: '1', concept: 'ISR', reference: 'Artículo 96 LISR', amount: 2482.80, display_order: 1 },
    { id: '2', concept: 'IMSS', reference: 'Trabajador', amount: 482.15, display_order: 2 },
    { id: '3', concept: 'Infonavit', reference: 'Crédito', amount: 2600.00, display_order: 3 },
    { id: '4', concept: 'Fondo de Ahorro', reference: 'Contrato', amount: 400.00, display_order: 4 },
  ]);

  const [activeTab, setActiveTab] = useState<'general' | 'earnings' | 'deductions' | 'payment'>('general');
  const [isDownloading, setIsDownloading] = useState(false);

  // Preselección por URL query param (?personId=...)
  useEffect(() => {
    const paramPersonId = searchParams.get('personId');
    if (paramPersonId) {
      handlePersonChange(paramPersonId);
    }
  }, [searchParams]);

  // Cálculos reactivos
  const totals = calculateTotals(earnings, deductions);
  const selectedPerson = activeCompanyPeople.find(p => p.id === personId) || selectedPersonDefault;

  // Actualizar datos bancarios al cambiar de persona
  const handlePersonChange = (newPersonId: string) => {
    setPersonId(newPersonId);
    const p = activeCompanyPeople.find(person => person.id === newPersonId);
    if (p) {
      if (p.bank_name) setBankName(p.bank_name);
      if (p.bank_account_masked) setBankAccountMasked(p.bank_account_masked);
    }
  };

  // Manejadores de Percepciones
  const addEarningRow = () => {
    setEarnings(prev => [
      ...prev,
      { id: Date.now().toString(), concept: 'Nuevo Concepto', reference: 'Evento', amount: 0, display_order: prev.length + 1 }
    ]);
  };

  const updateEarningRow = (id: string, field: keyof ReceiptEarning, value: string | number) => {
    setEarnings(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeEarningRow = (id: string) => {
    setEarnings(prev => prev.filter(e => e.id !== id));
  };

  // Manejadores de Deducciones
  const addDeductionRow = () => {
    setDeductions(prev => [
      ...prev,
      { id: Date.now().toString(), concept: 'Nueva Deducción', reference: 'Retención', amount: 0, display_order: prev.length + 1 }
    ]);
  };

  const updateDeductionRow = (id: string, field: keyof ReceiptDeduction, value: string | number) => {
    setDeductions(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const removeDeductionRow = (id: string) => {
    setDeductions(prev => prev.filter(d => d.id !== id));
  };

  // Objeto de Recibo para Vista Previa en Vivo
  const liveReceipt: Receipt = {
    id: 'rec-preview',
    company_id: activeCompany?.id || '',
    person_id: personId,
    receipt_type: receiptType,
    folio: `${activeCompany?.folio_prefix || 'REC'}-${new Date().toISOString().slice(2, 7).replace('-', '')}-${String(activeCompany?.next_folio_number || 1).padStart(4, '0')}`,
    internal_folio: `${activeCompany?.folio_prefix || 'REC'}INT-015-${String(activeCompany?.next_folio_number || 1).padStart(4, '0')}`,
    issue_date: issueDate,
    payment_date: paymentDate,
    period_start: periodStart,
    period_end: periodEnd,
    frequency: frequency,
    status: status,
    currency: activeCompany?.currency || 'MXN',
    payment_method: paymentMethod,
    bank_name: bankName,
    bank_account_masked: bankAccountMasked,
    deposit_date: paymentDate,
    verification_code: 'PREV-9Q7R-DEMO',
    signer_name: signerName,
    signer_role: signerRole,
    signer_signature_url: signerSignatureUrl || null,
    notes: notes,
    total_earnings: totals.totalEarnings,
    total_deductions: totals.totalDeductions,
    net_total: totals.netTotal,
    company: activeCompany || undefined,
    person: selectedPerson || undefined,
    earnings: earnings,
    deductions: deductions,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const handleSave = (newStatus?: ReceiptStatus) => {
    if (!personId) {
      alert('Por favor selecciona un colaborador del directorio.');
      return;
    }

    const saved = addReceipt({
      person_id: personId,
      receipt_type: receiptType,
      frequency: frequency,
      status: newStatus || status,
      issue_date: issueDate,
      payment_date: paymentDate,
      period_start: periodStart,
      period_end: periodEnd,
      payment_method: paymentMethod,
      bank_name: bankName,
      bank_account_masked: bankAccountMasked,
      deposit_date: paymentDate,
      signer_name: signerName,
      signer_role: signerRole,
      signer_signature_url: signerSignatureUrl || null,
      notes: notes,
      earnings: earnings,
      deductions: deductions,
    });

    router.push(`/receipts/${saved.id}`);
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      await downloadReceiptAsPdf({
        elementId: 'live-receipt-container',
        filename: `RECIBO_${activeCompany?.folio_prefix}_${liveReceipt.folio}_${selectedPerson?.full_name?.replace(/\s+/g, '_') || 'RECIBO'}.pdf`
      });
    } catch (err) {
      alert('Error al generar PDF: ' + err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Barra Superior con Acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 no-print">
          <div className="flex items-center space-x-3">
            <Link
              href="/receipts"
              className="p-2 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Emisión de Recibo Digital
              </h1>
              <p className="text-xs text-slate-500">
                Completa los datos en el formulario para actualizar la vista previa en tiempo real.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSave('draft')}
              className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3 rounded-lg border border-slate-300 shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Borrador</span>
            </button>

            <button
              onClick={() => handleSave('authorized')}
              className="flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2 px-3 rounded-lg border border-blue-200 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Autorizar</span>
            </button>

            <button
              onClick={() => handleSave('paid')}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Marcar Pagado y Guardar</span>
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

        {/* Advertencia si Deducciones superan Percepciones */}
        {totals.totalDeductions > totals.totalEarnings && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-center space-x-3 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>
              ¡Atención! El total de deducciones ({formatCurrency(totals.totalDeductions)}) supera el total de percepciones ({formatCurrency(totals.totalEarnings)}). El neto a pagar resultará en $0.00.
            </span>
          </div>
        )}

        {/* Layout Split-Screen: Formulario a la izquierda, Vista Previa a la derecha */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Panel Izquierdo: Formulario de Edición (5 cols) */}
          <div className="xl:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden no-print">
            {/* Pestañas de Navegación del Formulario */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
              <button
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-3 px-2 text-center border-b-2 transition-colors ${
                  activeTab === 'general'
                    ? 'border-cyan-600 text-cyan-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. General
              </button>
              <button
                onClick={() => setActiveTab('earnings')}
                className={`flex-1 py-3 px-2 text-center border-b-2 transition-colors ${
                  activeTab === 'earnings'
                    ? 'border-cyan-600 text-cyan-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Percepciones ({earnings.length})
              </button>
              <button
                onClick={() => setActiveTab('deductions')}
                className={`flex-1 py-3 px-2 text-center border-b-2 transition-colors ${
                  activeTab === 'deductions'
                    ? 'border-cyan-600 text-cyan-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Deducciones ({deductions.length})
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`flex-1 py-3 px-2 text-center border-b-2 transition-colors ${
                  activeTab === 'payment'
                    ? 'border-cyan-600 text-cyan-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                4. Pago & Firma
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Pestaña 1: General & Persona */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Colaborador / Trabajador <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddPersonModalOpen(true)}
                        className="text-[11px] font-bold text-cyan-600 hover:text-cyan-700 flex items-center space-x-1 bg-cyan-50 hover:bg-cyan-100 px-2 py-0.5 rounded-md border border-cyan-200 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Registrar Nuevo</span>
                      </button>
                    </div>
                    <select
                      value={personId}
                      onChange={(e) => handlePersonChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    >
                      {activeCompanyPeople.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.full_name} ({p.internal_id || p.position || 'Sin ID'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Recibo</label>
                      <select
                        value={receiptType}
                        onChange={(e) => setReceiptType(e.target.value as ReceiptType)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      >
                        <option value="payroll">Recibo de Nómina</option>
                        <option value="collaborator_payment">Pago a Colaborador</option>
                        <option value="commission">Comisiones</option>
                        <option value="fees">Honorarios</option>
                        <option value="reimbursement">Reembolso</option>
                        <option value="supplier_payment">Pago a Proveedor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Frecuencia / Nómina</label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value as ReceiptFrequency)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      >
                        <option value="weekly">Semanal</option>
                        <option value="biweekly">Quincenal</option>
                        <option value="monthly">Mensual</option>
                        <option value="special">Especial</option>
                        <option value="other">Ordinario</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Emisión</label>
                      <input
                        type="date"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Pago</label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Inicio de Periodo</label>
                      <input
                        type="date"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fin de Periodo</label>
                      <input
                        type="date"
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Estado Inicial</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['draft', 'authorized', 'paid'] as ReceiptStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatus(st)}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                            status === st
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {st === 'draft' ? 'Borrador' : st === 'authorized' ? 'Autorizado' : 'Pagado'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Pestaña 2: Percepciones Dinámicas */}
              {activeTab === 'earnings' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Conceptos de Percepción</span>
                    <button
                      type="button"
                      onClick={addEarningRow}
                      className="flex items-center space-x-1 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 px-2.5 py-1.5 rounded-lg border border-teal-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Concepto</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {earnings.map((e) => (
                      <div key={e.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            placeholder="Concepto (ej. Sueldo Base)"
                            value={e.concept}
                            onChange={(ev) => updateEarningRow(e.id, 'concept', ev.target.value)}
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold w-full mr-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeEarningRow(e.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Referencia (ej. 15.00 días)"
                            value={e.reference}
                            onChange={(ev) => updateEarningRow(e.id, 'reference', ev.target.value)}
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                          />
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={e.amount}
                              onChange={(ev) => updateEarningRow(e.id, 'amount', parseFloat(ev.target.value) || 0)}
                              className="bg-white border border-slate-300 rounded pl-5 pr-2 py-1 text-xs font-bold text-right w-full focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-teal-50 p-3 rounded-lg border border-teal-200 flex justify-between items-center text-xs font-bold text-teal-900">
                    <span>TOTAL PERCEPCIONES:</span>
                    <span className="text-sm font-black">{formatCurrency(totals.totalEarnings)}</span>
                  </div>
                </div>
              )}

              {/* Pestaña 3: Deducciones Dinámicas */}
              {activeTab === 'deductions' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Conceptos de Deducción</span>
                    <button
                      type="button"
                      onClick={addDeductionRow}
                      className="flex items-center space-x-1 text-xs font-bold text-slate-800 hover:text-slate-900 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Deducción</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {deductions.map((d) => (
                      <div key={d.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            placeholder="Concepto (ej. ISR)"
                            value={d.concept}
                            onChange={(ev) => updateDeductionRow(d.id, 'concept', ev.target.value)}
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold w-full mr-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeDeductionRow(d.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Referencia (ej. Trabajador)"
                            value={d.reference}
                            onChange={(ev) => updateDeductionRow(d.id, 'reference', ev.target.value)}
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                          />
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={d.amount}
                              onChange={(ev) => updateDeductionRow(d.id, 'amount', parseFloat(ev.target.value) || 0)}
                              className="bg-white border border-slate-300 rounded pl-5 pr-2 py-1 text-xs font-bold text-right w-full focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-100 p-3 rounded-lg border border-slate-300 flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>TOTAL DEDUCCIONES:</span>
                    <span className="text-sm font-black">{formatCurrency(totals.totalDeductions)}</span>
                  </div>
                </div>
              )}

              {/* Pestaña 4: Pago, Firmante y Notas */}
              {activeTab === 'payment' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Banco Emisor</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cuenta Enmascarada</label>
                      <input
                        type="text"
                        value={bankAccountMasked}
                        onChange={(e) => setBankAccountMasked(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Firmante</label>
                      <input
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Puesto del Firmante</label>
                      <input
                        type="text"
                        value={signerRole}
                        onChange={(e) => setSignerRole(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <ImageUploader
                    label="Firma Autorizada Digitalizada"
                    value={signerSignatureUrl}
                    onChange={(newUrl) => setSignerSignatureUrl(newUrl)}
                    onClear={() => setSignerSignatureUrl('')}
                    description="Sube una firma o trazo en PNG con fondo transparente para este recibo."
                  />

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Notas Internas</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel Derecho: Vista Previa en Vivo de Alta Fidelidad (7 cols) */}
          <div className="xl:col-span-7 space-y-3">
            <div className="flex items-center justify-between no-print">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                <Eye className="w-4 h-4 text-cyan-600" />
                <span>Vista Previa en Vivo (Formato Carta Horizontal)</span>
              </div>
              <span className="text-[11px] text-slate-400">Idéntica a la impresión final</span>
            </div>

            {/* Contenedor del Recibo para PDF e Impresión */}
            <div id="live-receipt-container" className="overflow-x-auto p-1 bg-slate-200/50 rounded-2xl border border-slate-300">
              <ReceiptTemplate receipt={liveReceipt} />
            </div>
          </div>
        </div>

        {/* Modal de Registro Rápido de Colaborador */}
        <QuickAddPersonModal
          isOpen={isAddPersonModalOpen}
          onClose={() => setIsAddPersonModalOpen(false)}
          onSuccess={(newP) => handlePersonChange(newP.id)}
        />
      </div>
    </AppLayout>
  );
}

export default function NewReceiptPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Cargando creador de recibos...</div>}>
      <NewReceiptForm />
    </Suspense>
  );
}
