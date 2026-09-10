'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { UserRole } from '@/lib/auth';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    name: string;
    role: UserRole;
  } | null>(null);

  const [lowStockCount, setLowStockCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check user session from localStorage
    const savedUser = localStorage.getItem('bautstock_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem('bautstock_user');
      }
    }

    setIsLoaded(true);

    // Fetch low stock count for alert badge
    fetch('/api/products/low-stock-count')
      .then((res) => res.json())
      .then((data) => {
        if (data.count !== undefined) setLowStockCount(data.count);
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('bautstock_user');
    setCurrentUser(null);
    window.location.href = '/login';
  };

  // If on login page, render children directly without dashboard sidebar/header
  if (pathname === '/login') {
    return (
      <html lang="id">
        <head>
          <title>Login - MUSTIKA BAUT</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body className="antialiased bg-slate-950 text-slate-900 min-h-screen">
          <ToastProvider>{children}</ToastProvider>
        </body>
      </html>
    );
  }

  // If not logged in and loaded, redirect to login page
  if (isLoaded && !currentUser) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  const userRole = currentUser?.role || 'KASIR';

  return (
    <html lang="id">
      <head>
        <title>MUSTIKA BAUT - Sistem Manajemen Stok & Penjualan Toko Baut</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        <ToastProvider>
          <div className="flex min-h-screen">
            {/* Desktop Sidebar */}
            <Sidebar
              userRole={userRole}
              userName={currentUser?.name}
              lowStockCount={lowStockCount}
              onLogout={handleLogout}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
              <Header currentUser={currentUser} onLogout={handleLogout} />
              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
            </div>
          </div>

          {/* Mobile Bottom Nav */}
          <MobileNav userRole={userRole} lowStockCount={lowStockCount} />
        </ToastProvider>
      </body>
    </html>
  );
}
