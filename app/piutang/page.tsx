'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Search, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { formatRupiah, formatTanggal, getPaymentStatusBadge } from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function PiutangPage() {
  const { showToast } = useToast();
  const [receivables, setReceivables] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [payingReceivable, setPayingReceivable] = useState<any | null>(null);

  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('TRANSFER');
  const [notes, setNotes] = useState('Cicilan / Pelunasan Piutang');

  const fetchReceivables = async () => {
    try {
      const res = await fetch(`/api/piutang?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setReceivables(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, [search]);

  const handleOpenPayment = (r: any) => {
    setPayingReceivable(r);
    setPaymentAmount(r.remainingAmount);
    setNotes(`Pelunasan invoice ${r.sale?.invoiceNo}`);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingReceivable) return;

    try {
      const res = await fetch('/api/piutang/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receivableId: payingReceivable.id,
          amount: paymentAmount,
          paymentMethod,
          notes,
          userName: 'Kasir',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mencatat pembayaran');
      }

      showToast('Pembayaran piutang berhasil dicatat!', 'success');
      setPayingReceivable(null);
      fetchReceivables();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const totalPiutang = receivables.reduce((sum, r) => sum + r.remainingAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-rose-600" />
            <span>Pencatatan Piutang Pelanggan</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manajemen tagihan transaksi tempo penjualan, jatuh tempo, & pencatatan pembayaran cicilan.
          </p>
        </div>

        <div className="bg-rose-50 border border-rose-200 px-5 py-3 rounded-2xl text-right">
          <span className="text-[10px] font-bold text-rose-600 block uppercase">Total Piutang Belum Lunas</span>
          <span className="text-xl font-black text-rose-700">{formatRupiah(totalPiutang)}</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama pelanggan atau nomor invoice..."
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
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Invoice</th>
                <th className="py-3 px-4">Total Tagihan</th>
                <th className="py-3 px-4">Sudah Dibayar</th>
                <th className="py-3 px-4">Sisa Piutang</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receivables.map((r) => {
                const badgeClass = getPaymentStatusBadge(r.status);
                const isOverdue = new Date(r.dueDate) < new Date() && r.remainingAmount > 0;

                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{r.customer?.name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-700">{r.sale?.invoiceNo}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{formatRupiah(r.totalAmount)}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">{formatRupiah(r.paidAmount)}</td>
                    <td className="py-3 px-4 font-extrabold text-rose-600">{formatRupiah(r.remainingAmount)}</td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                        {formatTanggal(r.dueDate, false)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${badgeClass}`}>
                        {isOverdue ? 'JATUH TEMPO' : r.status === 'PAID' ? 'LUNAS' : 'BELUM LUNAS'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.remainingAmount > 0 && (
                        <button
                          onClick={() => handleOpenPayment(r)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs shadow-sm"
                        >
                          Catat Pembayaran
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

      {payingReceivable && (
        <Modal
          isOpen={!!payingReceivable}
          onClose={() => setPayingReceivable(null)}
          title={`Catat Pembayaran Piutang: ${payingReceivable.customer?.name}`}
        >
          <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-bold">{payingReceivable.sale?.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sisa Tagihan:</span>
                <span className="font-extrabold text-rose-600">{formatRupiah(payingReceivable.remainingAmount)}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Jumlah Pembayaran (Rp)</label>
              <input
                type="number"
                max={payingReceivable.remainingAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border font-bold text-base text-emerald-600"
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
                <option value="CASH">Tunai (Cash)</option>
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
                onClick={() => setPayingReceivable(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
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
