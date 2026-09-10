'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, XCircle, ShoppingCart, ArrowRight } from 'lucide-react';
import { formatRupiah, getStockStatus } from '@/lib/formatters';
import Link from 'next/link';

export default function StokMinimumPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRestockProducts() {
      try {
        const res = await fetch('/api/products?minStockOnly=true');
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRestockProducts();
  }, []);

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
  const outOfStock = products.filter((p) => p.stock <= 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <span>Radar Stok Minimum & Reorder List</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftar otomatis barang fastener yang perlu segera di-restock ke supplier.
          </p>
        </div>

        <Link
          href="/pembelian"
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Buat Pembelian Restock</span>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-800">Status Stok Menipis</p>
            <h3 className="text-2xl font-black text-amber-700 mt-1">{lowStock.length} SKU</h3>
            <p className="text-[11px] text-amber-600 mt-1">Jumlah stok ≤ stok minimum</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>

        <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-800">Status Stok Habis (0 Pcs)</p>
            <h3 className="text-2xl font-black text-rose-700 mt-1">{outOfStock.length} SKU</h3>
            <p className="text-[11px] text-rose-600 mt-1">Segera pesan ke supplier</p>
          </div>
          <XCircle className="w-8 h-8 text-rose-600" />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
              <tr>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Nama Barang & Specs</th>
                <th className="py-3 px-4">Lokasi Rak</th>
                <th className="py-3 px-4 text-center">Stok Fisik</th>
                <th className="py-3 px-4 text-center">Minimum Stok</th>
                <th className="py-3 px-4 text-right">Modal Beli</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const statusInfo = getStockStatus(p.stock, p.minStock);

                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-sky-700">{p.sku}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{p.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {p.category} | {p.itemType} | {p.metric} x {p.length} | {p.material}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.warehouse} / {p.rackLocation}
                    </td>
                    <td className="py-3 px-4 text-center font-black text-rose-600">{p.stock} {p.unit}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">{p.minStock} {p.unit}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-700">{formatRupiah(p.buyPrice)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${statusInfo.badge}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href="/pembelian"
                        className="px-3 py-1 bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white border border-sky-200 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
                      >
                        <span>Pesan</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    Selamat! Semua produk berada di atas batas stok minimum.
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
