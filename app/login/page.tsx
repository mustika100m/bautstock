'use client';

import React, { useState } from 'react';
import { Hexagon, Lock, User, LogIn } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal login');
      }

      // Save user session in localStorage
      localStorage.setItem('bautstock_user', JSON.stringify(data));
      
      showToast(`Selamat datang kembali, ${data.name}! (Role: ${data.role})`, 'success');
      
      // Force page reload / navigation so layout picks up the user session
      window.location.href = '/';
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl space-y-6 text-white">
        {/* Header Logo */}
        <div className="text-center space-y-3">
          <div className="bg-white p-4 rounded-3xl border border-slate-700/80 shadow-2xl inline-block mx-auto overflow-hidden">
            <img
              src="/logo.png"
              alt="MUSTIKA BAUT"
              className="h-16 sm:h-20 w-auto object-contain mx-auto rounded-2xl"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            MUSTIKA <span className="text-sky-400">BAUT</span>
          </h1>
          <p className="text-xs text-slate-400">
            Sistem Manajemen Stok & Penjualan Toko Baut & Fastener
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-400" /> Username
            </label>
            <input
              type="text"
              placeholder="Masukkan username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-sky-400" /> Password
            </label>
            <input
              type="password"
              placeholder="Masukkan password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'Memproses Login...' : 'Masuk ke Aplikasi'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
