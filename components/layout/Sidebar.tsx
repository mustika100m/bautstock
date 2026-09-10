'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  Truck,
  CreditCard,
  Wallet,
  ArrowLeftRight,
  ClipboardCheck,
  AlertTriangle,
  Barcode,
  BarChart3,
  UserCheck,
  Settings,
  History,
  Hexagon,
  LogOut,
} from 'lucide-react';
import { UserRole, hasPermission } from '@/lib/auth';

interface SidebarProps {
  userRole: UserRole;
  userName?: string;
  lowStockCount?: number;
  onLogout?: () => void;
}

export function Sidebar({ userRole, userName, lowStockCount = 0, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'VIEW_CEK_STOK' },
    { href: '/cek-stok', label: 'Cek Stok', icon: Search, highlight: true, permission: 'VIEW_CEK_STOK' },
    { href: '/master-barang', label: 'Master Barang', icon: Package, permission: 'VIEW_PRODUCTS' },
    { href: '/penjualan', label: 'Penjualan (POS)', icon: Receipt, permission: 'CREATE_SALE' },
    { href: '/pembelian', label: 'Pembelian', icon: ShoppingCart, permission: 'CREATE_PURCHASE' },
    { href: '/pelanggan', label: 'Pelanggan', icon: Users, permission: 'VIEW_CUSTOMERS' },
    { href: '/supplier', label: 'Supplier', icon: Truck, permission: 'CREATE_PURCHASE' },
    { href: '/piutang', label: 'Piutang', icon: CreditCard, permission: 'CREATE_SALE' },
    { href: '/hutang', label: 'Hutang', icon: Wallet, permission: 'CREATE_PURCHASE' },
    { href: '/mutasi-stok', label: 'Mutasi Stok', icon: ArrowLeftRight, permission: 'VIEW_STOCK_MOVEMENTS' },
    { href: '/stock-opname', label: 'Stock Opname', icon: ClipboardCheck, permission: 'CREATE_STOCK_OPNAME' },
    {
      href: '/stok-minimum',
      label: 'Stok Minimum',
      icon: AlertTriangle,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      permission: 'VIEW_MIN_STOCK',
    },
    { href: '/laporan', label: 'Laporan', icon: BarChart3, permission: 'VIEW_PRODUCTS' },
    { href: '/pengguna', label: 'Pengguna', icon: UserCheck, permission: 'CHANGE_NEGATIVE_STOCK_SETTING' },
    { href: '/pengaturan', label: 'Pengaturan', icon: Settings, permission: 'CHANGE_NEGATIVE_STOCK_SETTING' },
    { href: '/audit-log', label: 'Audit Log', icon: History, permission: 'CHANGE_NEGATIVE_STOCK_SETTING' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-3.5 border-b border-slate-800/80 bg-white/95 rounded-2xl mx-3 mt-3 shadow-md overflow-hidden flex items-center justify-center">
        <Link href="/" className="flex items-center justify-center">
          <img
            src="/logo.png"
            alt="MUSTIKA BAUT"
            className="h-14 w-auto max-w-full object-contain rounded-xl"
          />
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isAllowed = hasPermission(userRole, item.permission);
          if (!isAllowed) return null;

          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : item.highlight
                  ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : item.highlight ? 'text-amber-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Log Out Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-400">
          <span className="font-semibold text-slate-200 truncate">{userName || 'Pengguna'}</span>
          <span className="font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800/50">
            {userRole}
          </span>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-xl font-bold transition-all text-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
