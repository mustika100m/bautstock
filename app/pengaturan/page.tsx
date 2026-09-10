'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Store, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function PengaturanPage() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    storeName: '',
    address: '',
    phone: '',
    receiptHeader: '',
    receiptFooter: '',
    allowNegativeStock: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data) {
          setFormData({
            storeName: data.storeName || '',
            address: data.address || '',
            phone: data.phone || '',
            receiptHeader: data.receiptHeader || '',
            receiptFooter: data.receiptFooter || '',
            allowNegativeStock: data.allowNegativeStock || false,
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('bautstock_user') || '{}');
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userName: currentUser?.name || 'Owner' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pengaturan');
      
      showToast('Pengaturan toko & kebijakan stok berhasil diperbarui!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-sky-600" />
          <span>Pengaturan Sistem & Kebijakan Toko</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Atur informasi profil toko, footer cetak struk POS, serta aturan kontrol stok negatif (Owner Policy).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 text-xs">
        {/* Store Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 border-b pb-2 flex items-center gap-2">
            <Store className="w-4 h-4 text-sky-600" /> Profil & Header Struk Toko
          </h3>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Toko Baut</label>
            <input
              type="text"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              className="w-full p-2.5 rounded-xl border font-bold text-slate-800"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Telepon / WA</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat Toko</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 rounded-xl border font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Header Struk Penjualan</label>
            <input
              type="text"
              value={formData.receiptHeader}
              onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
              className="w-full p-2.5 rounded-xl border font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Footer Struk Penjualan</label>
            <textarea
              value={formData.receiptFooter}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              rows={2}
              className="w-full p-2.5 rounded-xl border font-semibold"
            />
          </div>
        </div>

        {/* Negative Stock Control Toggle */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
              <div>
                <h4 className="font-extrabold text-sm text-white">Izinkan Stok Negatif (OWNER ONLY)</h4>
                <p className="text-[11px] text-slate-400">
                  Secara standar, sistem mencegah transaksi jika stok &le; 0. Aktifkan jika ingin mengizinkan stok menjadi minus saat penjualan.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowNegativeStock}
                onChange={(e) => setFormData({ ...formData, allowNegativeStock: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
