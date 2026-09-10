'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Boxes,
  DollarSign,
  AlertTriangle,
  XCircle,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  Search,
  Receipt,
  ClipboardCheck,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { formatRupiah, formatTanggal, getStockStatus } from '@/lib/formatters';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [prodRes, salesRes, purRes, recRes] = await Promise.all([
          fetch('/api/products').then((r) => r.json()),
          fetch('/api/sales').then((r) => r.json()),
          fetch('/api/purchases').then((r) => r.json()),
          fetch('/api/piutang').then((r) => r.json()),
        ]);

        const products = prodRes.products || [];
        const sales = Array.isArray(salesRes) ? salesRes : [];
        const purchases = Array.isArray(purRes) ? purRes : [];
        const receivables = Array.isArray(recRes) ? recRes : [];

        const totalSku = products.length;
        const totalStock = products.reduce((acc: number, p: any) => acc + p.stock, 0);
        const nilaiPersediaan = products.reduce((acc: number, p: any) => acc + p.stock * p.buyPrice, 0);
        const minStockCount = products.filter((p: any) => p.stock > 0 && p.stock <= p.minStock).length;
        const outOfStockCount = products.filter((p: any) => p.stock <= 0).length;

        // Today's metrics
        const todayStr = new Date().toISOString().slice(0, 10);
        const todaySales = sales.filter((s: any) => s.status === 'COMPLETED' && s.date.slice(0, 10) === todayStr);
        const penjualanHariIni = todaySales.reduce((acc: number, s: any) => acc + s.grandTotal, 0);
        const todayPurchases = purchases.filter((p: any) => p.status === 'COMPLETED' && p.date.slice(0, 10) === todayStr);
        const pembelianHariIni = todayPurchases.reduce((acc: number, p: any) => acc + p.totalAmount, 0);

        const totalPiutang = receivables.reduce((acc: number, r: any) => acc + r.remainingAmount, 0);

        // Recent sales
        const recentSales = sales.slice(0, 5);

        setStats({
          totalSku,
          totalStock,
          nilaiPersediaan,
          minStockCount,
          outOfStockCount,
          penjualanHariIni,
          pembelianHariIni,
          totalPiutang,
          recentSales,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Access Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 text-[11px] font-bold tracking-wider rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 uppercase">
            Dashboard MUSTIKA BAUT
          </span>
          <h2 className="text-2xl font-black mt-2 tracking-tight">Sistem Manajemen Stok & Penjualan</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Selamat datang! Gunakan menu Cek Stok untuk mencari ukuran baut/fastener spesifik dengan cepat.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Link
            href="/cek-stok"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Cek Stok Barang</span>
          </Link>
          <Link
            href="/penjualan"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>POS Penjualan</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SKU */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total SKU Barang</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{stats?.totalSku || 0}</h3>
            <p className="text-[11px] font-medium text-emerald-600 mt-1">Item aktif terdaftar</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Total Stok Qty */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Fisik Stok (Qty)</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
              {(stats?.totalStock || 0).toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mt-1">Pcs dalam gudang</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Nilai Persediaan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Nilai Persediaan (HPP)</p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">
              {formatRupiah(stats?.nilaiPersediaan || 0)}
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mt-1">Modal barang di toko</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Piutang */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Piutang Belum Lunas</p>
            <h3 className="text-xl font-extrabold text-rose-600 mt-1">
              {formatRupiah(stats?.totalPiutang || 0)}
            </h3>
            <p className="text-[11px] font-medium text-rose-500 mt-1">Tagihan ke pelanggan</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Penjualan Hari Ini</p>
            <h3 className="text-xl font-extrabold text-emerald-600 mt-1">
              {formatRupiah(stats?.penjualanHariIni || 0)}
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Pembelian Hari Ini</p>
            <h3 className="text-xl font-extrabold text-blue-600 mt-1">
              {formatRupiah(stats?.pembelianHariIni || 0)}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <Link
          href="/stok-minimum"
          className="bg-amber-50/60 hover:bg-amber-50 rounded-2xl p-5 border border-amber-200/80 shadow-sm flex items-center justify-between transition-all group"
        >
          <div>
            <p className="text-xs font-semibold text-amber-800">Stok Menipis (Need Restock)</p>
            <h3 className="text-2xl font-extrabold text-amber-700 mt-1">
              {stats?.minStockCount || 0} SKU
            </h3>
          </div>
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </Link>

        <Link
          href="/stok-minimum"
          className="bg-rose-50/60 hover:bg-rose-50 rounded-2xl p-5 border border-rose-200/80 shadow-sm flex items-center justify-between transition-all group"
        >
          <div>
            <p className="text-xs font-semibold text-rose-800">Stok Habis (0 Pcs)</p>
            <h3 className="text-2xl font-extrabold text-rose-700 mt-1">
              {stats?.outOfStockCount || 0} SKU
            </h3>
          </div>
          <div className="p-3 bg-rose-100 text-rose-700 rounded-xl group-hover:scale-110 transition-transform">
            <XCircle className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Transaksi Penjualan Terbaru</h3>
            <p className="text-xs text-slate-500">5 transaksi terakhir yang diproses di kasir POS</p>
          </div>
          <Link
            href="/penjualan"
            className="flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700"
          >
            <span>Lihat Semua Penjualan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-100">
              <tr>
                <th className="py-3 px-4">No. Invoice</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Tipe Harga</th>
                <th className="py-3 px-4">Pembayaran</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentSales?.map((sale: any) => (
                <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-sky-700">{sale.invoiceNo}</td>
                  <td className="py-3 px-4 text-slate-600">{formatTanggal(sale.date)}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{sale.customerName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {sale.priceType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                        sale.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-rose-100 text-rose-700 border-rose-200'
                      }`}
                    >
                      {sale.paymentStatus === 'PAID' ? 'LUNAS' : 'TEMPO'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-slate-800">
                    {formatRupiah(sale.grandTotal)}
                  </td>
                </tr>
              ))}

              {(!stats?.recentSales || stats.recentSales.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada transaksi penjualan recorded
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
