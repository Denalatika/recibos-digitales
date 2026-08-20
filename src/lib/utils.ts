import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTHS_ES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

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

const MONTHS_SHORT = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
];

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
 * Genera un código de verificación seguro alfanumérico en grupos de 4 (ej. K3JL-9Q7R-D6EK)
 */
export function generateVerificationCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const segment = () => {
    let str = '';
    for (let i = 0; i < 4; i++) {
      str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
  };
  return `${segment()}-${segment()}-${segment()}`;
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

  // Redondear a 2 decimales para evitar problemas de precisión
  return {
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netTotal: Math.round(netTotal * 100) / 100,
  };
}
