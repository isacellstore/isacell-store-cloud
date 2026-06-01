import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency (DOP)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

// ID Generation
export function generateId(): string {
  return Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
}

// Date helpers
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentTime(): string {
  return new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
}

export function getCurrentDateTime(): string {
  return new Date().toLocaleString('es-DO');
}

export function cleanDigits(str: string): string {
  return str ? str.replace(/\D/g, '') : '';
}

// Validators
export const validators = {
  isIMEI: (imei: string) => /^\d{15}$/.test(cleanDigits(imei)),
  isPhone: (phone: string) => /^\d{10}$/.test(cleanDigits(phone)),
  isCedula: (cedula: string) => /^\d{11}$/.test(cleanDigits(cedula)),
  isRNC: (rnc: string) => /^\d{9,11}$/.test(cleanDigits(rnc)),
};

// Password hashing (SHA-256)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
}

// Permissions
export function getDefaultPermissions(role: string) {
  const allFalse = {
    pos: false, inventory: false, purchases: false, workshop: false,
    accounts: false, suppliers: false, cash: false, reports: false, settings: false
  };

  switch (role) {
    case 'admin':
      return { ...allFalse, pos: true, inventory: true, purchases: true, workshop: true, accounts: true, suppliers: true, cash: true, reports: true, settings: true };
    case 'ventas':
      return { ...allFalse, pos: true, inventory: true };
    case 'tecnico':
      return { ...allFalse, workshop: true, inventory: true };
    case 'supervisor':
      return { ...allFalse, pos: true, inventory: true, purchases: true, workshop: true, accounts: true, suppliers: true, cash: true, reports: true };
    default:
      return allFalse;
  }
}

// Sale receipt number
export function generateSaleNumber(seq: number): string {
  return `B01-${String(seq).padStart(6, '0')}`;
}

export function generateRepairNumber(seq: number): string {
  return `R-${String(seq).padStart(4, '0')}`;
}
