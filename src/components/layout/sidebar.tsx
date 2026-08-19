'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Receipt as ReceiptIcon, 
  Users, 
  Building2, 
  PlusCircle,
  FileText,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '@/context/app-context';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { 
    companies, 
    activeCompany, 
    setActiveCompanyId, 
    profile, 
    resetToDemoData 
  } = useApp();

  const navItems = [
    { href: '/', label: 'Panel Principal', icon: LayoutDashboard },
    { href: '/receipts', label: 'Recibos y Pagos', icon: ReceiptIcon },
    { href: '/people', label: 'Directorio de Personas', icon: Users },
    { href: '/companies', label: 'Empresas y Plantillas', icon: Building2 },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-screen flex flex-col justify-between border-r border-slate-800 no-print shrink-0">
      <div>
        {/* Logo de la Plataforma */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-cyan-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-white text-base tracking-wide">ReciboDigital</span>
              <span className="block text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Sistema de Nómina</span>
            </div>
          </div>
        </div>

        {/* Selector de Empresa Activa */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">
            Empresa Activa
          </label>
          <select
            value={activeCompany?.id || ''}
            onChange={(e) => setActiveCompanyId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-2 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.folio_prefix})
              </option>
            ))}
          </select>
        </div>

        {/* Accesos Rápidos */}
        <div className="px-4 pt-4 space-y-2">
          <Link
            href="/receipts/new"
            className="flex items-center justify-center space-x-2 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-md shadow-cyan-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Emitir Nuevo Recibo</span>
          </Link>

          <Link
            href="/people"
            className="flex items-center justify-center space-x-2 w-full bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs py-2 px-4 rounded-lg border border-slate-700 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>+ Agregar Trabajador / Personal</span>
          </Link>
        </div>

        {/* Navegación Principal */}
        <nav className="p-4 space-y-1.5 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Pie del Sidebar: Usuario & Utilidades */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
        <button
          onClick={() => {
            if (confirm('¿Restablecer todos los datos a la demostración original?')) {
              resetToDemoData();
            }
          }}
          className="flex items-center space-x-2 text-[11px] text-slate-400 hover:text-rose-400 transition-colors w-full px-2 py-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer Datos Demo</span>
        </button>

        <div className="flex items-center space-x-3 pt-2 border-t border-slate-800/60">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-white border border-slate-700">
            {profile.full_name.charAt(0)}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-white truncate">{profile.full_name}</p>
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                {profile.role === 'owner' ? 'Propietario' : profile.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
