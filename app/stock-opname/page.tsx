'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Search, Plus, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function StockOpnamePage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [opnames, setOpnames] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'baru' | 'riwayat'>('baru');

  // Opname Audit Sheet State
  const [opnameItems, setOpnameItems] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchOpnames();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOpnames = async () => {
    try {
      const res = await fetch('/api/stock-opname');
      const data = await res.json();
      setOpnames(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const addProductToOpname = (prod: any) => {
    if (opnameItems.some((i) => i.productId === prod.id)) return;
    setOpnameItems([
      ...opnameItems,
      {
        productId: prod.id,
        sku: prod.sku,
        name: prod.name,
        systemStock: prod.stock,
        physicalStock: prod.stock,
        notes: '',
      },
    ]);
  };

  const updatePhysicalStock = (productId: string, val: number) => {
    setOpnameItems(
      opnameItems.map((i) => (i.productId === productId ? { ...i, physicalStock: val } : i))
    );
  };

  const updateItemNotes = (productId: string, text: string) => {
    setOpnameItems(
      opnameItems.map((i) => (i.productId === productId ? { ...i, notes: text } : i))
    );
  };

  const removeItem = (productId: string) => {
    setOpnameItems(opnameItems.filter((i) => i.productId !== productId));
  };

  const handleProcessOpname = async () => {
    if (opnameItems.length === 0) {
      showToast('Tambahkan produk ke lembar opname!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/stock-opname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createdBy: 'Gudang BautStock',
          notes,
          items: opnameItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses stock opname');

      showToast(`Stock Opname ${data.opnameNo} berhasil diproses! Stok fisik diperbarui.`, 'success');
      setOpnameItems([]);
      setNotes('');
      fetchProducts();
      fetchOpnames();
      setActiveTab('riwayat');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-sky-600" />
            <span>Stock Opname & Audit Fisik</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Penyesuaian stok sistem dengan jumlah fisik aktual gudang. Selisih otomatis dicatat ke audit log.
          </p>
        </div>

        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('baru')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'baru' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Form Audit Opname Baru
          </button>
          <button
            onClick={() => setActiveTab('riwayat')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'riwayat' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Riwayat Audit Opname
          </button>
        </div>
      </div>

      {activeTab === 'baru' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Product Picker */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari barang untuk diaudit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                      SKU: {p.sku} | Stok Sistem: <span className="font-bold text-slate-900">{p.stock}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addProductToOpname(p)}
                    className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white rounded-lg font-bold transition-all text-xs flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Audit
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Sheet Table */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-md flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 border-b pb-2">
                Lembar Kerja Stock Opname
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                    <tr>
                      <th className="py-2 px-3">Nama Barang</th>
                      <th className="py-2 px-3 text-center">Stok Sistem</th>
                      <th className="py-2 px-3 text-center w-24">Stok Fisik</th>
                      <th className="py-2 px-3 text-center">Selisih</th>
                      <th className="py-2 px-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {opnameItems.map((item) => {
                      const diff = item.physicalStock - item.systemStock;

                      return (
                        <tr key={item.productId} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-800">{item.name}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-600">{item.systemStock}</td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={item.physicalStock}
                              onChange={(e) => updatePhysicalStock(item.productId, Number(e.target.value))}
                              className="w-full p-1 border rounded text-center font-extrabold"
                            />
                          </td>
                          <td className={`py-2 px-3 text-center font-black ${diff < 0 ? 'text-rose-600' : diff > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {diff > 0 ? `+${diff}` : diff}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="Alasan selisih..."
                              value={item.notes}
                              onChange={(e) => updateItemNotes(item.productId, e.target.value)}
                              className="w-full p-1 border rounded text-[11px]"
                            />
                          </td>
                        </tr>
                      );
                    })}

                    {opnameItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Pilih barang di sebelah kiri untuk diaudit fisik
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <button
                onClick={handleProcessOpname}
                disabled={isSubmitting || opnameItems.length === 0}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-sm rounded-xl shadow-lg disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                <span>{isSubmitting ? 'Memproses Audit...' : 'Proses & Update Stok Sistem'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Opname History */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4">Riwayat Stock Opname</h3>
          <div className="space-y-4">
            {opnames.map((o) => (
              <div key={o.id} className="border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs border-b pb-2">
                  <span className="font-extrabold text-sky-700 font-mono">{o.opnameNo}</span>
                  <span className="text-slate-500">{new Date(o.createdAt).toLocaleString('id-ID')}</span>
                </div>
                <div className="text-xs text-slate-600 font-medium">Petugas: {o.createdBy}</div>

                <div className="bg-slate-50 p-2 rounded-lg text-xs space-y-1">
                  {o.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="font-bold text-slate-800">{item.product?.name}</span>
                      <span>
                        Sistem: {item.systemStock} | Fisik: {item.physicalStock} |{' '}
                        <span className={`font-bold ${item.difference < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          Selisih: {item.difference > 0 ? `+${item.difference}` : item.difference}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
