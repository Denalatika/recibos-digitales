'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  Receipt as ReceiptIcon, 
  DollarSign, 
  PlusCircle, 
  ArrowUpRight, 
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Ban,
  ShieldCheck,
  Printer,
  Download,
  Share2,
  Copy,
  Eye,
  UserPlus
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { QuickAddPersonModal } from '@/components/people/quick-add-person-modal';
import { useApp } from '@/context/app-context';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ReceiptStatus, ReceiptType } from '@/types/database';

export default function DashboardPage() {
  const { 
    activeCompany, 
    activeCompanyReceipts, 
    activeCompanyPeople,
    companies,
    duplicateReceipt,
    createShareLink
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false);

  // Cálculos de métricas del Dashboard
  const totalPaid = activeCompanyReceipts
    .filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + r.net_total, 0);

  const totalPending = activeCompanyReceipts
    .filter(r => r.status === 'draft' || r.status === 'authorized')
    .reduce((sum, r) => sum + r.net_total, 0);

  const totalReceipts = activeCompanyReceipts.length;
  const activePeopleCount = activeCompanyPeople.length;

  // Filtrado de recibos recientes
  const filteredReceipts = activeCompanyReceipts.filter(r => {
    const personName = r.person?.full_name?.toLowerCase() || '';
    const folio = r.folio.toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = personName.includes(search) || folio.includes(search);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesType = typeFilter === 'all' || r.receipt_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleShare = (receiptId: string) => {
    const shareInfo = createShareLink(receiptId);
    navigator.clipboard.writeText(shareInfo.url);
    setCopiedToken(receiptId);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const statusBadges: Record<ReceiptStatus, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'Borrador', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: <Clock className="w-3 h-3" /> },
    authorized: { label: 'Autorizado', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: <ShieldCheck className="w-3 h-3" /> },
    paid: { label: 'Pagado', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
    cancelled: { label: 'Cancelado', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: <Ban className="w-3 h-3" /> },
  };

  const typeLabels: Record<ReceiptType, string> = {
    payroll: 'Nómina',
    collaborator_payment: 'Colaborador',
    commission: 'Comisión',
    fees: 'Honorarios',
    reimbursement: 'Reembolso',
    supplier_payment: 'Proveedor',
    general: 'General',
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Banner Superior de Bienvenida y Empresa */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-cyan-950/80 border border-cyan-800/80 px-3 py-1 rounded-full text-xs font-bold text-cyan-300">
              <Building2 className="w-3.5 h-3.5" />
              <span>{activeCompany?.business_name || activeCompany?.name}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Panel de Control Administrativo
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Genera comprobantes y recibos internos con cálculo automático, impresión calibrada y validación QR.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/receipts/new"
              className="flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs py-3 px-5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Emitir Recibo</span>
            </Link>

            <button
              onClick={() => setIsAddPersonModalOpen(true)}
              className="flex items-center space-x-2 bg-cyan-900/60 hover:bg-cyan-800/80 text-cyan-200 font-bold text-xs py-3 px-4 rounded-xl border border-cyan-700/60 transition-all"
            >
              <UserPlus className="w-4 h-4 text-cyan-300" />
              <span>+ Registrar Trabajador</span>
            </button>

            <Link
              href="/companies"
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 px-4 rounded-xl border border-slate-700 transition-colors"
            >
              <span>Personalizar Plantilla</span>
              <ArrowUpRight className="w-4 h-4 text-cyan-400" />
            </Link>
          </div>
        </div>

        {/* Tarjetas de Métricas Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pagado</p>
              <h3 className="text-xl font-black text-slate-900 mt-1">{formatCurrency(totalPaid)}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Recibos liquidados</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Por Liquidar</p>
              <h3 className="text-xl font-black text-slate-900 mt-1">{formatCurrency(totalPending)}</h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Borradores / Autorizados</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Recibos Emitidos</p>
              <h3 className="text-xl font-black text-slate-900 mt-1">{totalReceipts}</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">
                Prefijo: <span className="font-bold text-slate-800">{activeCompany?.folio_prefix}</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
              <ReceiptIcon className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Directorio Activo</p>
              <h3 className="text-xl font-black text-slate-900 mt-1">{activePeopleCount}</h3>
              <div className="mt-1 flex items-center space-x-2">
                <Link href="/people" className="text-[11px] text-cyan-600 font-bold hover:underline">
                  Ver Directorio
                </Link>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => setIsAddPersonModalOpen(true)}
                  className="text-[11px] text-indigo-600 font-bold hover:underline"
                >
                  + Agregar
                </button>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tabla de Recibos Recientes con Filtros */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Recibos y Comprobantes Recientes</h2>
              <p className="text-xs text-slate-500">Listado de documentos emitidos para la empresa actual.</p>
            </div>

            {/* Barra de Búsqueda y Filtros */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o folio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none w-56"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs py-1.5 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="all">Todos los Estados</option>
                <option value="draft">Borrador</option>
                <option value="authorized">Autorizado</option>
                <option value="paid">Pagado</option>
                <option value="cancelled">Cancelado</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs py-1.5 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="all">Todos los Tipos</option>
                <option value="payroll">Nómina</option>
                <option value="collaborator_payment">Colaborador</option>
                <option value="commission">Comisión</option>
                <option value="fees">Honorarios</option>
              </select>
            </div>
          </div>

          {/* Tabla de Documentos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Folio / Verificación</th>
                  <th className="py-3 px-4">Persona / Colaborador</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Fecha Pago</th>
                  <th className="py-3 px-4 text-right">Neto a Pagar</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.map((r) => {
                  const statusInfo = statusBadges[r.status] || statusBadges.draft;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900">{r.folio}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.verification_code}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{r.person?.full_name || 'Desconocido'}</div>
                        <div className="text-[11px] text-slate-500">{r.person?.position || r.person?.department || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded text-[11px]">
                          {typeLabels[r.receipt_type] || r.receipt_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {formatDate(r.payment_date, 'clean')}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                        {formatCurrency(r.net_total)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full font-bold text-[10px] border ${statusInfo.color}`}>
                          {statusInfo.icon}
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Link
                            href={`/receipts/${r.id}`}
                            title="Ver documento completo"
                            className="p-1.5 text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-md transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <Link
                            href={`/receipts/${r.id}/edit`}
                            title="Editar recibo"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <ReceiptIcon className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => {
                              duplicateReceipt(r.id);
                              alert('¡Recibo duplicado con nuevo folio consecutivo!');
                            }}
                            title="Duplicar para crear uno nuevo rápidamente"
                            className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleShare(r.id)}
                            title="Copiar enlace temporal de validación"
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredReceipts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No se encontraron recibos con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {copiedToken && (
            <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 text-center">
              ✓ ¡Enlace temporal copiado al portapapeles!
            </div>
          )}
        </div>

        {/* Modal de Registro Rápido de Colaborador */}
        <QuickAddPersonModal
          isOpen={isAddPersonModalOpen}
          onClose={() => setIsAddPersonModalOpen(false)}
        />
      </div>
    </AppLayout>
  );
}
