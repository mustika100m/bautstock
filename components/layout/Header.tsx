'use client';

import React from 'react';
import { UserRole } from '@/lib/auth';
import { User, Store, LogOut, Search, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  currentUser: {
    id?: string;
    username?: string;
    name?: string;
    role: UserRole;
  } | null;
  onLogout: () => void;
}

export function Header({ currentUser, onLogout }: HeaderProps) {
  const roleColors: Record<string, string> = {
    OWNER: 'bg-purple-100 text-purple-800 border-purple-300',
    ADMIN: 'bg-blue-100 text-blue-800 border-blue-300',
    KASIR: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    GUDANG: 'bg-amber-100 text-amber-800 border-amber-300',
  };

  const userRole = currentUser?.role || 'KASIR';
  const badgeStyle = roleColors[userRole] || 'bg-slate-100 text-slate-800 border-slate-300';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Quick Action Link & Search */}
        <div className="flex items-center gap-3">
          <Link
            href="/cek-stok"
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-all shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Cari / Cek Stok Barang</span>
          </Link>
        </div>

        {/* User Info & Log Out */}
        <div className="flex items-center gap-3">
          <Link
            href="/penjualan"
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-500/20 transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>POS Penjualan</span>
          </Link>

          {/* User Info Badge (Static Display, NO Dropdown) */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <User className="w-4 h-4 text-slate-600" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">{currentUser?.name || 'User'}</span>
              <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border uppercase ${badgeStyle}`}>
                {userRole}
              </span>
            </div>
          </div>

          {/* Log Out Button */}
          <button
            onClick={onLogout}
            title="Keluar / Log Out"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
