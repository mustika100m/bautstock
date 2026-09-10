'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Printer, Calendar, Filter } from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/lib/formatters';

export default function LaporanPage() {
  const [activeReport, setActiveReport] = useState('stok');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { id: 'stok', label: '1. Laporan Stok' },
    { id: 'barang-habis', label: '2. Laporan Barang Habis' },
    { id: 'stok-minimum', label: '3. Laporan Stok Minimum' },
    { id: 'penjualan', label: '4. Laporan Penjualan' },
    { id: 'pembelian', label: '5. Laporan Pembelian' },
    { id: 'laba-kotor', label: '6. Laporan Laba Kotor' },
    { id: 'barang-terlaris', label: '7. Barang Terlaris' },
    { id: 'penjualan-pelanggan', label: '8. Sales per Pelanggan' },
    { id: 'pembelian-supplier', label: '9. Pembelian per Supplier' },
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ type: activeReport });
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);

      const res = await fetch(`/api/reports?${query.toString()}`);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, startDate, endDate]);

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Laporan BautStock - ${activeReport.toUpperCase()}\n\n`;

    if (activeReport === 'stok' && reportData?.products) {
      csvContent += 'SKU,Nama Barang,Kategori,Jenis,Stok,Harga Beli,Nilai Total\n';
      reportData.products.forEach((p: any) => {
        csvContent += `"${p.sku}","${p.name}","${p.category}","${p.itemType}",${p.stock},${p.buyPrice},${p.stock * p.buyPrice}\n`;
      });
    } else if (activeReport === 'penjualan' && reportData?.sales) {
      csvContent += 'Invoice,Tanggal,Pelanggan,Tipe Harga,Grand Total,Status\n';
      reportData.sales.forEach((s: any) => {
        csvContent += `"${s.invoiceNo}","${s.date}","${s.customerName}","${s.priceType}",${s.grandTotal},"${s.paymentStatus}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_${activeReport}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sky-600" />
            <span>Pusat Laporan Toko BautStock</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Analisis laporan stok, penjualan, omset, laba kotor, & performa pelanggan/supplier.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Report Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>Filter Tanggal:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 text-xs font-semibold rounded-xl border border-slate-200"
          />
          <span className="text-xs text-slate-400">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 text-xs font-semibold rounded-xl border border-slate-200"
          />
        </div>

        {/* Report Selector Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {reportTypes.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveReport(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                activeReport === r.id
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Report Results Content */}
      <div id="printable-area" className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Memuat laporan...</div>
        ) : (
          <>
            {/* Laba Kotor Summary Special Card */}
            {activeReport === 'laba-kotor' && reportData?.summary && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-700 block uppercase">Total Penjualan (Omset)</span>
                  <span className="text-2xl font-black text-emerald-800">{formatRupiah(reportData.summary.totalPenjualan)}</span>
                </div>
                <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200">
                  <span className="text-xs font-bold text-rose-700 block uppercase">Total HPP (Modal Barang Sold)</span>
                  <span className="text-2xl font-black text-rose-800">{formatRupiah(reportData.summary.totalHpp)}</span>
                </div>
                <div className="bg-sky-50 p-5 rounded-2xl border border-sky-200">
                  <span className="text-xs font-bold text-sky-700 block uppercase">ESTIMASI LABA KOTOR</span>
                  <span className="text-2xl font-black text-sky-800">{formatRupiah(reportData.summary.labaKotor)}</span>
                </div>
              </div>
            )}

            {/* Table Display for Products */}
            {(activeReport === 'stok' || activeReport === 'barang-habis' || activeReport === 'stok-minimum') && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                    <tr>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Nama Barang</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4 text-center">Stok</th>
                      <th className="py-3 px-4 text-right">Harga Modal</th>
                      <th className="py-3 px-4 text-right">Total Nilai Persediaan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reportData?.products?.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-sky-700">{p.sku}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                        <td className="py-3 px-4 text-slate-600">{p.category}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">{p.stock}</td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-600">{formatRupiah(p.buyPrice)}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900">{formatRupiah(p.stock * p.buyPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table Display for Sales */}
            {activeReport === 'penjualan' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                    <tr>
                      <th className="py-3 px-4">Invoice</th>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Pelanggan</th>
                      <th className="py-3 px-4">Tipe Harga</th>
                      <th className="py-3 px-4 text-right">Grand Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reportData?.sales?.map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-sky-700">{s.invoiceNo}</td>
                        <td className="py-3 px-4 text-slate-600">{formatTanggal(s.date)}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{s.customerName}</td>
                        <td className="py-3 px-4 font-semibold text-slate-600">{s.priceType}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-600">{formatRupiah(s.grandTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table Display for Top Selling */}
            {activeReport === 'barang-terlaris' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                    <tr>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Nama Produk</th>
                      <th className="py-3 px-4 text-center">Total Terjual (Qty)</th>
                      <th className="py-3 px-4 text-right">Total Omset Penjualan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reportData?.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-sky-700">{item.product?.sku}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{item.product?.name}</td>
                        <td className="py-3 px-4 text-center font-extrabold text-emerald-600">{item.totalQty} Pcs</td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900">{formatRupiah(item.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
