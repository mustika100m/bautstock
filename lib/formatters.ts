/**
 * Format numbers to Indonesian Rupiah currency: e.g. Rp 1.500.000
 */
export function formatRupiah(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ISO dates to Indonesian date format: e.g. 9 September 2026, 10:30 WIB
 */
export function formatTanggal(dateInput: string | Date | null | undefined, includeTime = true): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  };
  
  return new Intl.DateTimeFormat('id-ID', options).format(d);
}

/**
 * Stock status helper
 */
export function getStockStatus(stock: number, minStock: number): { label: string; color: string; badge: string } {
  if (stock <= 0) {
    return {
      label: 'Stok Habis',
      color: 'red',
      badge: 'bg-red-100 text-red-700 border-red-200',
    };
  }
  if (stock <= minStock) {
    return {
      label: 'Stok Menipis',
      color: 'amber',
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
    };
  }
  return {
    label: 'Normal',
    color: 'emerald',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
}

/**
 * Payment status badge helper
 */
export function getPaymentStatusBadge(status: string): string {
  switch (status.toUpperCase()) {
    case 'PAID':
    case 'LUNAS':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'PARTIAL':
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'UNPAID':
    case 'BELUM LUNAS':
      return 'bg-red-100 text-red-700 border border-red-200';
    case 'OVERDUE':
    case 'JATUH TEMPO':
      return 'bg-rose-600 text-white font-semibold animate-pulse';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}
