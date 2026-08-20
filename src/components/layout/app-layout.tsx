'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { useApp } from '@/context/app-context';
import { Loader2 } from 'lucide-react';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoadingAuth } = useApp();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Cargando sesión segura...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 print:block print:bg-white print:min-h-0">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 print:block print:w-full">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none print:w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
