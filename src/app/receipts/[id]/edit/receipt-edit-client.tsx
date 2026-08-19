'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  UserPlus
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { PrintableReceiptContainer } from '@/components/receipt/printable-receipt-container';
import { ImageUploader } from '@/components/ui/image-uploader';
import { QuickAddPersonModal } from '@/components/people/quick-add-person-modal';
import { useApp } from '@/context/app-context';
import { calculateTotals } from '@/lib/utils';
import { 
  Receipt, 
  ReceiptType, 
  ReceiptFrequency, 
  ReceiptStatus, 
  PaymentMethod,
  ReceiptEarning,
  ReceiptDeduction
} from '@/types/database';

export function ReceiptEditClient({ id }: { id: string }) {
  const router = useRouter();
  const { getReceipt, updateReceipt, activeCompanyPeople } = useApp();

  const originalReceipt = getReceipt(id);

  // Estados del Formulario
  const [personId, setPersonId] = useState<string>(originalReceipt?.person_id || '');
  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false);
  const [receiptType, setReceiptType] = useState<ReceiptType>(originalReceipt?.receipt_type || 'payroll');
  const [frequency, setFrequency] = useState<ReceiptFrequency>(originalReceipt?.frequency || 'biweekly');
  const [status, setStatus] = useState<ReceiptStatus>(originalReceipt?.status || 'draft');
  const [issueDate, setIssueDate] = useState<string>(originalReceipt?.issue_date || '');
  const [paymentDate, setPaymentDate] = useState<string>(originalReceipt?.payment_date || '');
  const [periodStart, setPeriodStart] = useState<string>(originalReceipt?.period_start || '');
  const [periodEnd, setPeriodEnd] = useState<string>(originalReceipt?.period_end || '');
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(originalReceipt?.payment_method || 'bank_transfer');
  const [bankName, setBankName] = useState<string>(originalReceipt?.bank_name || 'Santander');
  const [bankAccountMasked, setBankAccountMasked] = useState<string>(originalReceipt?.bank_account_masked || '•••• 6712');
  
  const [signerName, setSignerName] = useState<string>(originalReceipt?.signer_name || 'Lic. Karla Hernández López');
  const [signerRole, setSignerRole] = useState<string>(originalReceipt?.signer_role || 'Gerente de Administración');
  const [signerSignatureUrl, setSignerSignatureUrl] = useState<string>(originalReceipt?.signer_signature_url || '');
  const [notes, setNotes] = useState<string>(originalReceipt?.notes || '');

  const [earnings, setEarnings] = useState<ReceiptEarning[]>(originalReceipt?.earnings || []);
  const [deductions, setDeductions] = useState<ReceiptDeduction[]>(originalReceipt?.deductions || []);
  const [activeTab, setActiveTab] = useState<'general' | 'earnings' | 'deductions' | 'payment'>('general');

  useEffect(() => {
    if (originalReceipt) {
      setPersonId(originalReceipt.person_id);
      setReceiptType(originalReceipt.receipt_type);
      setFrequency(originalReceipt.frequency);
      setStatus(originalReceipt.status);
      setIssueDate(originalReceipt.issue_date);
      setPaymentDate(originalReceipt.payment_date);
      setPeriodStart(originalReceipt.period_start);
      setPeriodEnd(originalReceipt.period_end);
      setPaymentMethod(originalReceipt.payment_method);
      setBankName(originalReceipt.bank_name || '');
      setBankAccountMasked(originalReceipt.bank_account_masked || '');
      setSignerName(originalReceipt.signer_name || '');
      setSignerRole(originalReceipt.signer_role || '');
      setSignerSignatureUrl(originalReceipt.signer_signature_url || '');
      setNotes(originalReceipt.notes || '');
      setEarnings(originalReceipt.earnings || []);
      setDeductions(originalReceipt.deductions || []);
    }
  }, [originalReceipt]);

  if (!originalReceipt) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <p className="text-slate-500">Recibo no encontrado.</p>
        </div>
      </AppLayout>
    );
  }

  const totals = calculateTotals(earnings, deductions);
  const selectedPerson = activeCompanyPeople.find(p => p.id === personId) || originalReceipt.person;

  // Manejadores de Percepciones
  const addEarningRow = () => {
    setEarnings(prev => [
      ...prev,
      { id: Date.now().toString(), concept: 'Nuevo Concepto', reference: 'Evento', amount: 0, display_order: prev.length + 1 }
    ]);
  };

  const updateEarningRow = (eid: string, field: keyof ReceiptEarning, value: string | number) => {
    setEarnings(prev => prev.map(e => e.id === eid ? { ...e, [field]: value } : e));
  };

  const removeEarningRow = (eid: string) => {
    setEarnings(prev => prev.filter(e => e.id !== eid));
  };

  // Manejadores de Deducciones
  const addDeductionRow = () => {
    setDeductions(prev => [
      ...prev,
      { id: Date.now().toString(), concept: 'Nueva Deducción', reference: 'Retención', amount: 0, display_order: prev.length + 1 }
    ]);
  };

  const updateDeductionRow = (did: string, field: keyof ReceiptDeduction, value: string | number) => {
    setDeductions(prev => prev.map(d => d.id === did ? { ...d, [field]: value } : d));
  };

  const removeDeductionRow = (did: string) => {
    setDeductions(prev => prev.filter(d => d.id !== did));
  };

  const liveReceipt: Receipt = {
    ...originalReceipt,
    person_id: personId,
    receipt_type: receiptType,
    frequency: frequency,
    status: status,
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
    total_earnings: totals.totalEarnings,
    total_deductions: totals.totalDeductions,
    net_total: totals.netTotal,
    earnings: earnings,
    deductions: deductions,
    person: selectedPerson,
  };

  const handleSave = (newStatus?: ReceiptStatus) => {
    updateReceipt(originalReceipt.id, {
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

    router.push(`/receipts/${originalReceipt.id}`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Barra Superior con Acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 no-print">
          <div className="flex items-center space-x-3">
            <Link
              href={`/receipts/${originalReceipt.id}`}
              className="p-2 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Editando Recibo {originalReceipt.folio}
              </h1>
              <p className="text-xs text-slate-500">
                Los cambios se reflejan en tiempo real en la vista previa del documento.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSave()}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Cambios</span>
            </button>

            <button
              onClick={() => handleSave('paid')}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Guardar y Marcar Pagado</span>
            </button>
          </div>
        </div>

        {/* Layout Split-Screen */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start print:block print:w-full print:m-0 print:p-0">
          {/* Panel Izquierdo: Formulario */}
          <div className="xl:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden no-print">
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
                      onChange={(e) => setPersonId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    >
                      {activeCompanyPeople.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tipo</label>
                      <select
                        value={receiptType}
                        onChange={(e) => setReceiptType(e.target.value as ReceiptType)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium"
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
                      <label className="block text-xs font-bold text-slate-700 mb-1">Frecuencia</label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value as ReceiptFrequency)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium"
                      >
                        <option value="weekly">Semanal</option>
                        <option value="biweekly">Quincenal</option>
                        <option value="monthly">Mensual</option>
                        <option value="special">Especial</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Pago</label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as ReceiptStatus)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium"
                      >
                        <option value="draft">Borrador</option>
                        <option value="authorized">Autorizado</option>
                        <option value="paid">Pagado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'earnings' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Percepciones</span>
                    <button
                      type="button"
                      onClick={addEarningRow}
                      className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1.5 rounded-lg border border-teal-200 flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir</span>
                    </button>
                  </div>
                  {earnings.map(e => (
                    <div key={e.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={e.concept}
                          onChange={(ev) => updateEarningRow(e.id, 'concept', ev.target.value)}
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold w-full mr-2"
                        />
                        <button onClick={() => removeEarningRow(e.id)} className="text-slate-400 hover:text-rose-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={e.reference}
                          onChange={(ev) => updateEarningRow(e.id, 'reference', ev.target.value)}
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={e.amount}
                          onChange={(ev) => updateEarningRow(e.id, 'amount', parseFloat(ev.target.value) || 0)}
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-right"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'deductions' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Deducciones</span>
                    <button
                      type="button"
                      onClick={addDeductionRow}
                      className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-300 flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir</span>
                    </button>
                  </div>
                  {deductions.map(d => (
                    <div key={d.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={d.concept}
                          onChange={(ev) => updateDeductionRow(d.id, 'concept', ev.target.value)}
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold w-full mr-2"
                        />
                        <button onClick={() => removeDeductionRow(d.id)} className="text-slate-400 hover:text-rose-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={d.reference}
                          onChange={(ev) => updateDeductionRow(d.id, 'reference', ev.target.value)}
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={d.amount}
                          onChange={(ev) => updateDeductionRow(d.id, 'amount', parseFloat(ev.target.value) || 0)}
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-right"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Banco</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cuenta</label>
                      <input
                        type="text"
                        value={bankAccountMasked}
                        onChange={(e) => setBankAccountMasked(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
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
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Puesto del Firmante</label>
                      <input
                        type="text"
                        value={signerRole}
                        onChange={(e) => setSignerRole(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>

                  <ImageUploader
                    label="Firma Autorizada Digitalizada"
                    value={signerSignatureUrl}
                    onChange={(newUrl) => setSignerSignatureUrl(newUrl)}
                    onClear={() => setSignerSignatureUrl('')}
                    description="Sube una firma en PNG con fondo transparente para este recibo."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Panel Derecho: Vista Previa */}
          <div className="xl:col-span-7 space-y-3 print:w-full print:max-w-none print:m-0 print:p-0 print:block print:space-y-0">
            <PrintableReceiptContainer receipt={liveReceipt} showControls={true} />
          </div>
        </div>

        {/* Modal de Registro Rápido de Colaborador */}
        <QuickAddPersonModal
          isOpen={isAddPersonModalOpen}
          onClose={() => setIsAddPersonModalOpen(false)}
          onSuccess={(newP) => {
            setPersonId(newP.id);
            if (newP.bank_name) setBankName(newP.bank_name);
            if (newP.bank_account_masked) setBankAccountMasked(newP.bank_account_masked);
          }}
        />
      </div>
    </AppLayout>
  );
}
