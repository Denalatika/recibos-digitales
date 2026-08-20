'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Lock, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  Loader2
} from 'lucide-react';
import { useApp } from '@/context/app-context';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, isCloudConnected } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    try {
      setIsLoading(true);
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError === 'Invalid login credentials' 
          ? 'Credenciales incorrectas. Verifica tu correo y contraseña.' 
          : signInError
        );
        setIsLoading(false);
        return;
      }
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Error inesperado durante el inicio de sesión.');
      setIsLoading(false);
    }
  };

  const handleDemoAccess = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between p-4 sm:p-6 text-slate-100">
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        {/* Logo y Encabezado */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold mx-auto shadow-xl shadow-cyan-500/20">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              ReciboDigital
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Plataforma Privada de Recibos Digitales Administrativos
            </p>
          </div>
        </div>

        {/* Tarjeta de Formulario de Inicio de Sesión */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">
              Acceso al Panel Privado
            </h2>
            <div className="flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              <span>{isCloudConnected ? 'Nube Conectada' : 'Acceso Seguro'}</span>
            </div>
          </div>

          {error && (
            <div className="bg-rose-950/60 border border-rose-800/80 p-3.5 rounded-xl flex items-start space-x-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="admin@tuempresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800 text-center space-y-2">
            <p className="text-[11px] text-slate-400">
              Acceso restringido. Las cuentas son gestionadas por el propietario de la organización.
            </p>

            <div>
              <button
                type="button"
                onClick={handleDemoAccess}
                className="text-[10.5px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                Explorar en Modo Demostración Local
              </button>
            </div>
          </div>
        </div>

        {/* Aviso de Confidencialidad */}
        <div className="text-center text-[10px] text-slate-500 space-y-1">
          <p>Documento de control administrativo interno. No sustituye un CFDI de nómina timbrado.</p>
          <p>© 2026 ReciboDigital • Seguridad y Resguardo Administrativo</p>
        </div>
      </div>
    </div>
  );
}
