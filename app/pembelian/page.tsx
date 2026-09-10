'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, Search, Truck, CheckCircle2, Ban, Printer, Edit, Eye } from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function PembelianPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'baru' | 'riwayat'>('baru');

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);

  // Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [isPaid, setIsPaid] = useState(true);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail, Edit & Print state
  const [viewingPurchase, setViewingPurchase] = useState<any | null>(null);
  const [isEditingPurchase, setIsEditingPurchase] = useState(false);
  const [editPurchaseForm, setEditPurchaseForm] = useState({
    supplierInvoiceNo: '',
    notes: '',
  });
  const [printingPurchase, setPrintingPurchase] = useState<any | null>(null);

  // Cancel & Delete purchase modal
  const [cancellingPurchase, setCancellingPurchase] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('Restock dibatalkan');
  const [deletingPurchase, setDeletingPurchase] = useState<any | null>(null);

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
    fetchPurchases();
  }, []);

  const handleOpenPurchaseDetail = (p: any) => {
    setViewingPurchase(p);
    setIsEditingPurchase(false);
    setEditPurchaseForm({
      supplierInvoiceNo: p.supplierInvoiceNo || '',
      notes: p.notes || '',
    });
  };

  const handleUpdatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingPurchase) return;
    try {
      const res = await fetch(`/api/purchases/${viewingPurchase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPurchaseForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengupdate pembelian');

      showToast(`Data pembelian ${data.invoiceNo} berhasil diperbarui!`, 'success');
      setViewingPurchase(data);
      setIsEditingPurchase(false);
      fetchPurchases();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      setSuppliers(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPurchases = async () => {
    try {
      const res = await fetch('/api/purchases');
      const data = await res.json();
      setPurchases(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const addItemToPurchase = (prod: any) => {
    const existing = items.find((i) => i.productId === prod.id);
    if (existing) {
      setItems(
        items.map((i) => (i.productId === prod.id ? { ...i, qty: i.qty + 100 } : i))
      );
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          sku: prod.sku,
          name: prod.name,
          unit: prod.unit,
          qty: 100,
          buyPrice: prod.buyPrice,
          discount: 0,
        },
      ]);
    }
  };

  const updateItem = (productId: string, field: string, val: number) => {
    setItems(
      items.map((i) => (i.productId === productId ? { ...i, [field]: val } : i))
    );
  };

  const removeItem = (productId: string) => {
    setItems(items.filter((i) => i.productId !== productId));
  };

  const totalAmount = items.reduce(
    (sum, i) => sum + i.qty * i.buyPrice - (i.discount || 0),
    0
  );

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      showToast('Pilih supplier terlebih dahulu!', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Tambahkan barang yang dibeli!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          supplierInvoiceNo,
          isPaid,
          paidAmount: isPaid ? totalAmount : paidAmount,
          notes,
          items,
          userName: 'Admin/Gudang',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan transaksi');

      showToast(`Pembelian ${data.invoiceNo} disimpan! Stok otomatis bertambah.`, 'success');
      setItems([]);
      setSupplierInvoiceNo('');
      setNotes('');
      fetchProducts();
      fetchPurchases();
      setActiveTab('riwayat');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPurchase = async () => {
    if (!cancellingPurchase) return;
    try {
      const res = await fetch(`/api/purchases/${cancellingPurchase.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason, userName: 'Admin' }),
      });
      if (!res.ok) throw new Error('Gagal membatalkan pembelian');
      showToast(`Pembelian ${cancellingPurchase.invoiceNo} dibatalkan & stok dikurangi!`, 'success');
      setCancellingPurchase(null);
      fetchProducts();
      fetchPurchases();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeletePurchase = async () => {
    if (!deletingPurchase) return;
    try {
      const res = await fetch(`/api/purchases/${deletingPurchase.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus transaksi pembelian');
      showToast(`Transaksi pembelian ${deletingPurchase.invoiceNo} berhasil dihapus!`, 'success');
      setDeletingPurchase(null);
      if (viewingPurchase?.id === deletingPurchase.id) setViewingPurchase(null);
      fetchProducts();
      fetchPurchases();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchProduct.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-sky-600" />
            <span>Pembelian & Restock Barang</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Input transaksi barang masuk dari supplier untuk menambah stok persediaan secara otomatis.
          </p>
        </div>

        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('baru')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'baru'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Input Pembelian Baru
          </button>
          <button
            onClick={() => setActiveTab('riwayat')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'riwayat'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Riwayat Pembelian
          </button>
        </div>
      </div>

      {activeTab === 'baru' ? (
        <form onSubmit={handleSubmitPurchase} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Product selector */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari barang restock..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="flex-1 text-xs font-semibold focus:outline-none"
              />
            </div>

            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white p-3 rounded-xl border border-slate-200/80 hover:border-sky-500 shadow-sm flex items-center justify-between transition-all"
                >
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800">{p.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">
                      SKU: {p.sku} | Stok: <span className="font-bold text-sky-600">{p.stock}</span> | Modal: {formatRupiah(p.buyPrice)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItemToPurchase(p)}
                    className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white rounded-lg font-bold transition-all text-xs flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Pilih
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Purchase Invoice Details */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-md flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 border-b pb-2">
                Faktur / Nota Pembelian Supplier
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Supplier</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800"
                    required
                  >
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Invoice Supplier</label>
                  <input
                    type="text"
                    placeholder="Contoh: INV-SUP/88129"
                    value={supplierInvoiceNo}
                    onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>
              </div>

              {/* Items List Table */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 text-xs uppercase">
                  Daftar Barang Dibeli ({items.length})
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                      <tr>
                        <th className="py-2 px-3">Barang</th>
                        <th className="py-2 px-3 w-20">Qty</th>
                        <th className="py-2 px-3 w-28">Harga Beli</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                        <th className="py-2 px-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map((item) => (
                        <tr key={item.productId} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-800">{item.name}</td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => updateItem(item.productId, 'qty', Number(e.target.value))}
                              className="w-full p-1 border rounded text-center font-bold"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={item.buyPrice}
                              onChange={(e) => updateItem(item.productId, 'buyPrice', Number(e.target.value))}
                              className="w-full p-1 border rounded text-right font-bold"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-extrabold text-slate-800">
                            {formatRupiah(item.qty * item.buyPrice)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            Belum ada barang dipilih
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Total & Submit */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex justify-between items-center text-base font-black text-slate-900 bg-slate-100 p-3 rounded-xl">
                <span>TOTAL PEMBELIAN:</span>
                <span className="text-sky-600">{formatRupiah(totalAmount)}</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-sm rounded-xl shadow-lg disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pembelian & Update Stok'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Purchases History */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4">Riwayat Pembelian Barang</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-y">
                <tr>
                  <th className="py-3 px-4">No. Invoice</th>
                  <th className="py-3 px-4">Invoice Supplier</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total Transaksi</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {purchases.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleOpenPurchaseDetail(p)}
                    className="hover:bg-sky-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-sky-700">{p.invoiceNo}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{p.supplierInvoiceNo}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.supplier?.name}</td>
                    <td className="py-3 px-4 text-slate-600">{formatTanggal(p.date)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                          p.status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {p.status === 'CANCELLED' ? 'DIBATALKAN' : 'SELESAI'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-800">
                      {formatRupiah(p.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenPurchaseDetail(p)}
                          className="px-2.5 py-1 text-[10px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1"
                          title="Lihat Detail & Edit Pembelian"
                        >
                          <Eye className="w-3 h-3" /> Detail
                        </button>
                        <button
                          onClick={() => setPrintingPurchase(p)}
                          className="px-2.5 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center gap-1"
                          title="Cetak Ulang Nota Pembelian"
                        >
                          <Printer className="w-3 h-3" /> Cetak
                        </button>
                        {p.status !== 'CANCELLED' && (
                          <button
                            onClick={() => setCancellingPurchase(p)}
                            className="px-2.5 py-1 text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                            title="Batalkan Pembelian"
                          >
                            <Ban className="w-3 h-3" /> Batalkan
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingPurchase(p)}
                          className="p-1 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                          title="Hapus Transaksi Pembelian"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Viewing & Editing Purchase Modal */}
      {viewingPurchase && (
        <Modal
          isOpen={!!viewingPurchase}
          onClose={() => setViewingPurchase(null)}
          title={`Detail & Edit Pembelian Supplier: ${viewingPurchase.invoiceNo}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Top Action Bar */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">Status Restock:</span>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                    viewingPurchase.status === 'CANCELLED'
                      ? 'bg-rose-100 text-rose-700 border-rose-200'
                      : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {viewingPurchase.status === 'CANCELLED' ? 'DIBATALKAN' : 'SELESAI'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintingPurchase(viewingPurchase)}
                  className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-400" />
                  <span>Cetak Ulang Nota Pembelian</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPurchase(!isEditingPurchase)}
                  className="px-3 py-1.5 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 transition-all flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{isEditingPurchase ? 'Batal Edit' : 'Edit Pembelian'}</span>
                </button>
              </div>
            </div>

            {/* Editable Form vs Readonly Metadata */}
            {isEditingPurchase ? (
              <form onSubmit={handleUpdatePurchase} className="bg-sky-50/50 p-4 rounded-xl border border-sky-200 space-y-3">
                <h4 className="font-bold text-sky-900 border-b border-sky-200 pb-1">Edit Data Nota Pembelian</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">No. Invoice Supplier</label>
                    <input
                      type="text"
                      value={editPurchaseForm.supplierInvoiceNo}
                      onChange={(e) => setEditPurchaseForm({ ...editPurchaseForm, supplierInvoiceNo: e.target.value })}
                      className="w-full p-2 rounded-lg border font-mono font-bold bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                    <input
                      type="text"
                      value={editPurchaseForm.notes}
                      onChange={(e) => setEditPurchaseForm({ ...editPurchaseForm, notes: e.target.value })}
                      className="w-full p-2 rounded-lg border font-semibold bg-white"
                      placeholder="Catatan barang masuk..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-sky-200">
                  <button
                    type="button"
                    onClick={() => setIsEditingPurchase(false)}
                    className="px-3 py-1.5 font-bold text-slate-600 bg-white border hover:bg-slate-100 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 font-extrabold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Invoice Sistem</span>
                  <span className="font-extrabold text-slate-900 font-mono">{viewingPurchase.invoiceNo}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Invoice Supplier</span>
                  <span className="font-bold text-sky-700 font-mono">{viewingPurchase.supplierInvoiceNo || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Supplier</span>
                  <span className="font-extrabold text-slate-800">{viewingPurchase.supplier?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Tanggal Masuk</span>
                  <span className="font-semibold text-slate-800">{formatTanggal(viewingPurchase.date || viewingPurchase.createdAt)}</span>
                </div>
              </div>
            )}

            {/* Items Table */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2 uppercase text-[11px]">Rincian Barang Restock Dibeli</h4>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold border-b">
                    <tr>
                      <th className="py-2 px-3">Nama Barang</th>
                      <th className="py-2 px-3 text-center">Qty Masuk</th>
                      <th className="py-2 px-3 text-right">Harga Beli</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {viewingPurchase.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3 font-bold text-slate-800">{item.product?.name || 'Produk Fastener'}</td>
                        <td className="py-2 px-3 text-center font-bold text-emerald-700">+{item.qty} {item.product?.unit || 'Pcs'}</td>
                        <td className="py-2 px-3 text-right text-slate-600">{formatRupiah(item.buyPrice)}</td>
                        <td className="py-2 px-3 text-right font-extrabold text-slate-900">{formatRupiah(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center text-sm font-black">
              <span>TOTAL PEMBELIAN RESTOCK:</span>
              <span className="text-sky-400 text-base">{formatRupiah(viewingPurchase.totalAmount)}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable Purchase Receipt Order Modal */}
      {printingPurchase && (
        <Modal
          isOpen={!!printingPurchase}
          onClose={() => setPrintingPurchase(null)}
          title={`Pratinjau Nota Pembelian Restock: ${printingPurchase.invoiceNo}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div
              id="printable-area"
              className="p-5 bg-white font-mono border border-slate-300 rounded-xl space-y-3 shadow-sm mx-auto max-w-[340px] text-slate-900"
            >
              <div className="text-center border-b border-dashed pb-3 border-slate-300">
                <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">FAKTUR PEMBELIAN BARANG</h3>
                <p className="text-[10px] text-slate-600 mt-0.5">RESTOCK PERSEDIAAN GUDANG</p>
              </div>

              <div className="text-[11px] space-y-1 border-b border-dashed pb-3 border-slate-300">
                <div className="flex justify-between">
                  <span>No. Invoice:</span>
                  <span className="font-bold">{printingPurchase.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Inv. Supplier:</span>
                  <span className="font-semibold">{printingPurchase.supplierInvoiceNo || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Supplier:</span>
                  <span className="font-bold">{printingPurchase.supplier?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{formatTanggal(printingPurchase.date)}</span>
                </div>
              </div>

              <div className="space-y-2 border-b border-dashed pb-3 border-slate-300">
                {printingPurchase.items?.map((item: any) => (
                  <div key={item.id} className="text-[11px]">
                    <div className="font-bold text-slate-900">{item.product?.name}</div>
                    <div className="flex justify-between text-slate-600">
                      <span>{item.qty} {item.product?.unit || 'Pcs'} x {formatRupiah(item.buyPrice)}</span>
                      <span className="font-bold text-slate-900">{formatRupiah(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm font-extrabold pt-1">
                <span>TOTAL BELI:</span>
                <span className="text-sky-700">{formatRupiah(printingPurchase.totalAmount)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl shadow hover:bg-slate-800 transition-all flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-sky-400" />
                <span>Cetak Nota Pembelian</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintingPurchase(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Purchase Modal */}
      {cancellingPurchase && (
        <Modal
          isOpen={!!cancellingPurchase}
          onClose={() => setCancellingPurchase(null)}
          title={`Pembatalan Pembelian: ${cancellingPurchase.invoiceNo}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Membatalkan transaksi ini akan menarik kembali stok barang dari gudang.
            </p>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Alasan Pembatalan</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                required
              />
            </div>
            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                onClick={() => setCancellingPurchase(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleCancelPurchase}
                className="px-5 py-2 font-extrabold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md"
              >
                Konfirmasi Pembatalan
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deletingPurchase && (
        <ConfirmDialog
          isOpen={!!deletingPurchase}
          onClose={() => setDeletingPurchase(null)}
          onConfirm={handleDeletePurchase}
          title="Hapus Transaksi Pembelian"
          message={`Apakah Anda yakin ingin menghapus transaksi pembelian ${deletingPurchase.invoiceNo} secara permanen? Transaksi akan dihapus dari riwayat dan stok produk restock akan dikurangi.`}
          isDangerous={true}
        />
      )}
    </div>
  );
}
