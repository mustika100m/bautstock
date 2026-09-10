'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Receipt,
  AlertTriangle,
  Menu,
  X,
  Package,
  ShoppingCart,
  Users,
  Truck,
  CreditCard,
  Wallet,
  ArrowLeftRight,
  ClipboardCheck,
  Barcode,
  BarChart3,
  UserCheck,
  Settings,
  History,
} from 'lucide-react';
import { UserRole, hasPermission } from '@/lib/auth';

interface MobileNavProps {
  userRole: UserRole;
  lowStockCount?: number;
}

export function MobileNav({ userRole, lowStockCount = 0 }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'VIEW_CEK_STOK' },
    { href: '/cek-stok', label: 'Cek Stok', icon: Search, permission: 'VIEW_CEK_STOK' },
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
    <>
      {/* Bottom Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 px-2 py-2 flex items-center justify-around text-slate-400">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            pathname === '/' ? 'text-sky-400' : 'hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/cek-stok"
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            pathname === '/cek-stok' ? 'text-sky-400' : 'hover:text-slate-200'
          }`}
        >
          <Search className="w-5 h-5 text-amber-400" />
          <span className="text-amber-300">Cek Stok</span>
        </Link>

        <Link
          href="/penjualan"
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            pathname === '/penjualan' ? 'text-emerald-400' : 'hover:text-slate-200'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span>POS</span>
        </Link>

        <Link
          href="/stok-minimum"
          className={`relative flex flex-col items-center gap-1 text-[10px] font-semibold ${
            pathname === '/stok-minimum' ? 'text-rose-400' : 'hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          <span>Restock</span>
          {lowStockCount > 0 && (
            <span className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </Link>

        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center gap-1 text-[10px] font-semibold hover:text-slate-200"
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </div>

      {/* Slide-out Menu Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex bg-slate-950/70 backdrop-blur-sm">
          <div className="w-4/5 max-w-sm bg-slate-900 text-slate-300 flex flex-col h-full shadow-2xl border-r border-slate-800">
            <div className="p-3 flex items-center justify-between border-b border-slate-800 bg-white/95 rounded-2xl overflow-hidden m-3 shadow-md">
              <img
                src="/logo.png"
                alt="MUSTIKA BAUT"
                className="h-10 w-auto object-contain rounded-lg"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                if (!hasPermission(userRole, item.permission)) return null;
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-1" onClick={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
}
