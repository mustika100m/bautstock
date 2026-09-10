'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Search, Filter } from 'lucide-react';
import { formatTanggal } from '@/lib/formatters';

export default function MutasiStokPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchMovements = async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (typeFilter) query.append('type', typeFilter);

      const res = await fetch(`/api/stock-movements?${query.toString()}`);
      const data = await res.json();
      setMovements(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [search, typeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-sky-600" />
          <span>Mutasi Stok & Ledger Persediaan</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Buku besar pencatatan riwayat setiap pergerakan barang masuk dan keluar di toko.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama barang, SKU, ref invoice, atau user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-48 bg-slate-50 p-2 text-xs font-bold rounded-xl border border-slate-200"
        >
          <option value="">-- Semua Jenis Movement --</option>
          <option value="PURCHASE">PURCHASE (Pembelian)</option>
          <option value="SALE">SALE (Penjualan)</option>
          <option value="STOCK_ADJUSTMENT">STOCK_ADJUSTMENT (Opname)</option>
          <option value="RETURN_IN">RETURN_IN (Retur Masuk)</option>
          <option value="RETURN_OUT">RETURN_OUT (Retur Keluar)</option>
          <option value="INITIAL_STOCK">INITIAL_STOCK (Stok Awal)</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Nama Produk & SKU</th>
                <th className="py-3 px-4">Jenis Transaksi</th>
                <th className="py-3 px-4">No. Referensi</th>
                <th className="py-3 px-4 text-center">Qty Masuk</th>
                <th className="py-3 px-4 text-center">Qty Keluar</th>
                <th className="py-3 px-4 text-center">Stok Akhir</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {formatTanggal(m.timestamp)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800">{m.product?.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{m.product?.sku}</div>
                  </td>
                  <td className="py-3 px-4 font-extrabold text-sky-700">
                    <span className="px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-[10px]">
                      {m.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-600">{m.refNo || '-'}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">
                    {m.qtyIn > 0 ? `+${m.qtyIn}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-rose-600">
                    {m.qtyOut > 0 ? `-${m.qtyOut}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-center font-black text-slate-900">{m.stockAfter}</td>
                  <td className="py-3 px-4 font-medium text-slate-700">{m.userName}</td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{m.notes || '-'}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Belum ada riwayat mutasi stok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
