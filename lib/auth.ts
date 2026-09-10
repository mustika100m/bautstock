export type UserRole = 'OWNER' | 'ADMIN' | 'KASIR' | 'GUDANG';

export interface UserSession {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

export const MOCK_USERS: UserSession[] = [
  { id: 'usr-1', username: 'owner', name: 'Bapak Pemilik (Owner)', role: 'OWNER' },
  { id: 'usr-2', username: 'admin', name: 'Siti Rahma (Admin)', role: 'ADMIN' },
  { id: 'usr-3', username: 'kasir', name: 'Budi Santoso (Kasir)', role: 'KASIR' },
  { id: 'usr-4', username: 'gudang', name: 'Eko Prasetyo (Gudang)', role: 'GUDANG' },
];

export function hasPermission(role: UserRole, action: string): boolean {
  if (role === 'OWNER') return true;
  
  if (role === 'ADMIN') {
    // Admin can do almost everything except owner-only settings (like changing owner system settings)
    return action !== 'CHANGE_NEGATIVE_STOCK_SETTING';
  }
  
  if (role === 'KASIR') {
    // Kasir can access POS sales, Cek Stok, and view customers/products
    const allowed = [
      'VIEW_CEK_STOK',
      'VIEW_PRODUCTS',
      'CREATE_SALE',
      'VIEW_SALES',
      'VIEW_CUSTOMERS',
    ];
    return allowed.includes(action);
  }
  
  if (role === 'GUDANG') {
    // Gudang can access stock management, purchases receiving, stock opname, stock movements, min stock
    const allowed = [
      'VIEW_CEK_STOK',
      'VIEW_PRODUCTS',
      'EDIT_PRODUCT_STOCK',
      'CREATE_PURCHASE',
      'VIEW_PURCHASES',
      'CREATE_STOCK_OPNAME',
      'VIEW_STOCK_MOVEMENTS',
      'VIEW_MIN_STOCK',
    ];
    return allowed.includes(action);
  }
  
  return false;
}
