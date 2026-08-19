'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  PlusCircle, 
  Search, 
  Eye, 
  Receipt as ReceiptIcon, 
  Copy, 
  Share2, 
  Trash2,
  CheckCircle2,
  Clock,
  Ban,
  ShieldCheck
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useApp } from '@/context/app-context';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ReceiptStatus, ReceiptType } from '@/types/database';

export default function ReceiptsListPage() {
  const { 
    activeCompany, 
    activeCompanyReceipts, 
    duplicateReceipt, 
    deleteReceipt,
    createShareLink 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

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
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Recibos y Comprobantes
            </h1>
            <p className="text-xs text-slate-500">
              Administración de comprobantes emitidos para {activeCompany?.name}.
            </p>
          </div>

          <Link
            href="/receipts/new"
            className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Emitir Nuevo Recibo</span>
          </Link>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por colaborador o folio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none flex-1 md:flex-initial"
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
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none flex-1 md:flex-initial"
            >
              <option value="all">Todos los Tipos</option>
              <option value="payroll">Nómina</option>
              <option value="collaborator_payment">Colaborador</option>
              <option value="commission">Comisión</option>
              <option value="fees">Honorarios</option>
              <option value="reimbursement">Reembolso</option>
              <option value="supplier_payment">Proveedor</option>
            </select>
          </div>
        </div>

        {/* Tabla de Recibos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                        <div className="text-[11px] text-slate-500">{r.person?.position || '-'}</div>
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
                              alert('¡Recibo duplicado con éxito!');
                            }}
                            title="Duplicar recibo"
                            className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleShare(r.id)}
                            title="Compartir enlace temporal"
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar este recibo?')) {
                                deleteReceipt(r.id);
                              }
                            }}
                            title="Eliminar recibo"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredReceipts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No se encontraron recibos emitidos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {copiedToken && (
            <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 text-center">
              ✓ ¡Enlace de validación copiado al portapapeles!
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
