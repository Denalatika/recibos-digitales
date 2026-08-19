'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
