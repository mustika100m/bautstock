'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, Search, DollarSign, Calendar } from 'lucide-react';
import { formatRupiah, formatTanggal, getPaymentStatusBadge } from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function HutangPage() {
  const { showToast } = useToast();
  const [payables, setPayables] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [payingPayable, setPayingPayable] = useState<any | null>(null);

  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'CASH'>('TRANSFER');
  const [notes, setNotes] = useState('Pembayaran Hutang Supplier');

  const fetchPayables = async () => {
    try {
      const res = await fetch(`/api/hutang?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setPayables(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayables();
  }, [search]);

  const handleOpenPayment = (p: any) => {
    setPayingPayable(p);
    setPaymentAmount(p.remainingAmount);
    setNotes(`Pelunasan pembelian ${p.purchase?.invoiceNo}`);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingPayable) return;

    try {
      const res = await fetch('/api/hutang/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payableId: payingPayable.id,
          amount: paymentAmount,
          paymentMethod,
          notes,
          userName: 'Admin',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mencatat pembayaran');
      }

      showToast('Pembayaran hutang ke supplier berhasil dicatat!', 'success');
      setPayingPayable(null);
      fetchPayables();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const totalHutang = payables.reduce((sum, p) => sum + p.remainingAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-600" />
            <span>Pencatatan Hutang Usaha (Supplier)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manajemen tagihan pembelian tempo ke supplier, tenggat waktu bayar, & pembayaran hutang.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 px-5 py-3 rounded-2xl text-right">
          <span className="text-[10px] font-bold text-blue-600 block uppercase">Total Hutang Belum Lunas</span>
          <span className="text-xl font-black text-blue-700">{formatRupiah(totalHutang)}</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Cari supplier atau invoice pembelian..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-xs font-semibold focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
              <tr>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">No. Invoice</th>
                <th className="py-3 px-4">Invoice Supplier</th>
                <th className="py-3 px-4">Total Hutang</th>
                <th className="py-3 px-4">Sudah Dibayar</th>
                <th className="py-3 px-4">Sisa Hutang</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payables.map((p) => {
                const badgeClass = getPaymentStatusBadge(p.status);
                const isOverdue = new Date(p.dueDate) < new Date() && p.remainingAmount > 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{p.supplier?.name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-700">{p.purchase?.invoiceNo}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.purchase?.supplierInvoiceNo}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{formatRupiah(p.totalAmount)}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">{formatRupiah(p.paidAmount)}</td>
                    <td className="py-3 px-4 font-extrabold text-blue-600">{formatRupiah(p.remainingAmount)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-600">{formatTanggal(p.dueDate, false)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${badgeClass}`}>
                        {isOverdue ? 'JATUH TEMPO' : p.status === 'PAID' ? 'LUNAS' : 'BELUM LUNAS'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.remainingAmount > 0 && (
                        <button
                          onClick={() => handleOpenPayment(p)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-lg text-xs shadow-sm"
                        >
                          Catat Bayar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {payingPayable && (
        <Modal
          isOpen={!!payingPayable}
          onClose={() => setPayingPayable(null)}
          title={`Bayar Hutang Supplier: ${payingPayable.supplier?.name}`}
        >
          <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-bold">{payingPayable.purchase?.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sisa Tagihan:</span>
                <span className="font-extrabold text-blue-600">{formatRupiah(payingPayable.remainingAmount)}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Jumlah Bayar (Rp)</label>
              <input
                type="number"
                max={payingPayable.remainingAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border font-bold text-base text-blue-600"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border font-bold"
              >
                <option value="TRANSFER">Transfer Bank</option>
                <option value="CASH">Kas Tunai</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Catatan</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border font-semibold"
              />
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setPayingPayable(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md"
              >
                Simpan Pembayaran
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
