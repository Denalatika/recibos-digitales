import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTHS_ES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

const MONTHS_SHORT = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
];

/**
 * Obtiene la URL base de la aplicación con la siguiente jerarquía estricta:
 * 1. NEXT_PUBLIC_APP_URL (si está configurada)
 * 2. VERCEL_PROJECT_PRODUCTION_URL o VERCEL_URL (en servidor)
 * 3. window.location.origin (únicamente en el navegador)
 * 4. http://localhost:3000 (solamente durante desarrollo local)
 */
export function getAppBaseUrl(): string {
  // 1. Variable explícita de entorno
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  // 2. Variables del entorno Vercel (servidor o build)
  if (typeof process !== 'undefined') {
    const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
    if (vercelProdUrl && vercelProdUrl.trim() !== '') {
      return `https://${vercelProdUrl.replace(/\/$/, '')}`;
    }

    const vercelUrl = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
    if (vercelUrl && vercelUrl.trim() !== '') {
      return `https://${vercelUrl.replace(/\/$/, '')}`;
    }
  }

  // 3. Origen del navegador
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // 4. Solo en desarrollo local
  return 'http://localhost:3000';
}

/**
 * Formatea una fecha en formato "15 / MAYO / 2024" o "15 MAYO 2024"
 */
export function formatDate(dateString?: string | null, format: 'with_slashes' | 'clean' | 'short' = 'with_slashes'): string {
  if (!dateString) return "-";
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2].padStart(2, '0');
      const monthName = MONTHS_ES[monthIdx] || parts[1];

      if (format === 'with_slashes') {
        return `${day} / ${monthName} / ${year}`;
      }
      if (format === 'clean') {
        return `${day} ${monthName} ${year}`;
      }
      return `${day}/${parts[1]}/${year}`;
    }
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const monthName = MONTHS_ES[d.getMonth()] || "";
    const year = d.getFullYear();
    if (format === 'with_slashes') {
      return `${day} / ${monthName} / ${year}`;
    }
    return `${day} ${monthName} ${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Formatea un rango de periodo: "01 AGO 2026 – 15 AGO 2026"
 */
export function formatPeriod(startStr?: string | null, endStr?: string | null): string {
  if (!startStr || !endStr) return "-";
  try {
    const formatShortDate = (str: string) => {
      const parts = str.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parts[2].padStart(2, '0');
        const month = MONTHS_SHORT[monthIdx] || parts[1];
        return `${day} ${month} ${year}`;
      }
      return str;
    };
    return `${formatShortDate(startStr)} – ${formatShortDate(endStr)}`;
  } catch {
    return `${startStr} – ${endStr}`;
  }
}

/**
 * Formatea cantidades de dinero a formato estándar "$ 14,000.00"
 */
export function formatCurrency(amount?: number | string | null, currency = 'MXN'): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  if (isNaN(num)) return "$ 0.00";
  
  const formatted = num.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `$ ${formatted}`;
}

/**
 * Enmascara una cuenta bancaria o tarjeta mostrando sólo los últimos 4 dígitos: "•••• 6712"
 */
export function maskBankAccount(account?: string | null): string {
  if (!account) return "•••• 0000";
  const clean = account.replace(/\s+/g, '');
  if (clean.length <= 4) return `•••• ${clean}`;
  const last4 = clean.slice(-4);
  return `•••• ${last4}`;
}

/**
 * Genera un código de verificación criptográficamente seguro (ej. K3JL-9Q7R-D6EK)
 */
export function generateVerificationCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const array = new Uint8Array(12);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 12; i++) array[i] = Math.floor(Math.random() * 256);
  }
  const segment = (offset: number) => {
    let str = '';
    for (let i = 0; i < 4; i++) {
      str += chars[array[offset + i] % chars.length];
    }
    return str;
  };
  return `${segment(0)}-${segment(4)}-${segment(8)}`;
}

/**
 * Genera un token aleatorio seguro para compartir enlaces (alta entropía de 32+ caracteres)
 */
export function generateSecureToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '') + Date.now().toString(36);
  }
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('') + Date.now().toString(36);
}

/**
 * Realiza cálculos exactos de percepciones, deducciones y neto
 */
export function calculateTotals(
  earnings: Array<{ amount: number | string }>,
  deductions: Array<{ amount: number | string }>
) {
  const totalEarnings = earnings.reduce((acc, curr) => {
    const val = typeof curr.amount === 'number' ? curr.amount : parseFloat(String(curr.amount || 0));
    return acc + (isNaN(val) ? 0 : Math.max(0, val));
  }, 0);

  const totalDeductions = deductions.reduce((acc, curr) => {
    const val = typeof curr.amount === 'number' ? curr.amount : parseFloat(String(curr.amount || 0));
    return acc + (isNaN(val) ? 0 : Math.max(0, val));
  }, 0);

  const netTotal = Math.max(0, totalEarnings - totalDeductions);

  return {
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netTotal: Math.round(netTotal * 100) / 100,
  };
}
