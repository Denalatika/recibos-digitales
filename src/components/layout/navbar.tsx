'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  ShieldCheck, 
  ExternalLink,
  Plus
} from 'lucide-react';
import { useApp } from '@/context/app-context';

export const Navbar: React.FC = () => {
  const { activeCompany } = useApp();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between no-print z-10">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Building2 className="w-4 h-4 text-cyan-600" />
          <span className="text-xs font-bold text-slate-800">
            {activeCompany?.name || 'Selecciona Empresa'}
          </span>
          <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-1.5 py-0.5 rounded">
            {activeCompany?.folio_prefix || 'REC'}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[11px] font-medium">Validación QR Activa</span>
        </div>

        <Link
          href="/receipts/new"
          className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo Recibo</span>
        </Link>
      </div>
    </header>
  );
};
