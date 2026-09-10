'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Barcode,
  Filter,
  Package,
  RotateCcw,
  Edit,
  History,
  PlusCircle,
  MapPin,
  Tag,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { formatRupiah, getStockStatus } from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function CekStokPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [specs, setSpecs] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Search Filters
  const [searchMethod, setSearchMethod] = useState<'filter' | 'text' | 'barcode'>('filter');
  const [searchText, setSearchText] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cascading Filter state
  const [category, setCategory] = useState('');
  const [itemType, setItemType] = useState('');
  const [metric, setMetric] = useState('');
  const [length, setLength] = useState('');
  const [material, setMaterial] = useState('');
  const [grade, setGrade] = useState('');
  const [finishing, setFinishing] = useState('');

  // Modals
  const [editModalProduct, setEditModalProduct] = useState<any | null>(null);
  const [addStockModalProduct, setAddStockModalProduct] = useState<any | null>(null);
  const [addStockQty, setAddStockQty] = useState(10);
  const [addStockNotes, setAddStockNotes] = useState('Quick Add Stock dari Cek Stok');
  const [historyModalProduct, setHistoryModalProduct] = useState<any | null>(null);
  const [productMovements, setProductMovements] = useState<any[]>([]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (searchMethod === 'text' && searchText) query.append('search', searchText);
      if (searchMethod === 'barcode' && barcodeInput) query.append('barcode', barcodeInput);
      if (searchMethod === 'filter') {
        if (category) query.append('category', category);
        if (itemType) query.append('itemType', itemType);
        if (metric) query.append('metric', metric);
        if (length) query.append('length', length);
        if (material) query.append('material', material);
        if (grade) query.append('grade', grade);
        if (finishing) query.append('finishing', finishing);
      }

      const res = await fetch(`/api/products?${query.toString()}`);
      const data = await res.json();
      setProducts(data.products || []);
      if (data.specs) setSpecs(data.specs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, itemType, metric, length, material, grade, finishing]);

  const handleResetFilters = () => {
    setCategory('');
    setItemType('');
    setMetric('');
    setLength('');
    setMaterial('');
    setGrade('');
    setFinishing('');
    setSearchText('');
    setBarcodeInput('');
    fetchProducts();
  };

  const handleQuickAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStockModalProduct) return;

    try {
      const res = await fetch('/api/stock-opname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createdBy: 'Kasir/Gudang',
          notes: addStockNotes,
          items: [
            {
              productId: addStockModalProduct.id,
              systemStock: addStockModalProduct.stock,
              physicalStock: addStockModalProduct.stock + Number(addStockQty),
              notes: addStockNotes,
            },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menambah stok');
      }

      showToast(`Stok ${addStockModalProduct.name} berhasil ditambah +${addStockQty} Pcs!`, 'success');
      setAddStockModalProduct(null);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenHistory = async (product: any) => {
    setHistoryModalProduct(product);
    try {
      const res = await fetch(`/api/stock-movements?productId=${product.id}`);
      const data = await res.json();
      setProductMovements(data || []);
    } catch (err) {
      setProductMovements([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Search className="w-6 h-6 text-amber-500" />
            <span>Cek Stok & Spesifikasi Baut</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pencarian cepat barang berdasarkan kombinasi spesifikasi, barcode scanner, atau teks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Filter</span>
          </button>
        </div>
      </div>

      {/* Search Method Selector Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-2">
        <button
          onClick={() => setSearchMethod('filter')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all ${
            searchMethod === 'filter'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>1. Dropdown Filter Spesifikasi</span>
        </button>

        <button
          onClick={() => setSearchMethod('text')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all ${
            searchMethod === 'text'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>2. Search Teks / SKU / Nama</span>
        </button>
      </div>

      {/* Method 1: Cascading Dropdowns */}
      {searchMethod === 'filter' && (
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-amber-400 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Filter Spesifikasi Bertingkat</span>
            </h3>
            <span className="text-xs text-slate-400">Pilih atribut untuk menyaring ukuran</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Kategori */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 text-xs font-bold text-white p-2.5 rounded-xl border border-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">-- Semua Kategori --</option>
                {specs.categories?.map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Jenis */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Jenis Barang</label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="w-full bg-slate-800 text-xs font-bold text-white p-2.5 rounded-xl border border-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">-- Semua Jenis --</option>
                {specs.itemTypes?.map((t: string) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Metric / Diameter */}
            <div>
              <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1">Metric (Diameter)</label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full bg-slate-800 text-xs font-bold text-amber-300 p-2.5 rounded-xl border border-amber-500/40 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">-- Semua Metric (M4, M8, M10, dll) --</option>
                {specs.metrics?.map((m: string) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Panjang */}
            <div>
              <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1">Panjang (mm)</label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full bg-slate-800 text-xs font-bold text-amber-300 p-2.5 rounded-xl border border-amber-500/40 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">-- Semua Panjang --</option>
                {specs.lengths?.map((l: string) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Material */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Material</label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full bg-slate-800 text-xs font-bold text-white p-2.5 rounded-xl border border-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">-- Semua Material --</option>
                {specs.materials?.map((mat: string) => (
                  <option key={mat} value={mat}>{mat}</option>
                ))}
              </select>
            </div>

            {/* Grade */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Grade / Kelas</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full bg-slate-800 text-xs font-bold text-white p-2.5 rounded-xl border border-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">-- Semua Grade --</option>
                {specs.grades?.map((g: string) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Finishing */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Finishing</label>
              <select
                value={finishing}
                onChange={(e) => setFinishing(e.target.value)}
                className="w-full bg-slate-800 text-xs font-bold text-white p-2.5 rounded-xl border border-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">-- Semua Finishing --</option>
                {specs.finishings?.map((f: string) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Method 2: Text Search */}
      {searchMethod === 'text' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari kata kunci nama baut, SKU (BT-HB-M8-100), atau spesifikasi..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
              className="w-full pl-11 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchProducts}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Cari
          </button>
        </div>
      )}



      {/* Product Results Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Menampilkan {products.length} produk ditemukan</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading produk...</div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Produk Tidak Ditemukan</h3>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kombinasi spesifikasi atau kata kunci filter Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((prod) => {
              const statusInfo = getStockStatus(prod.stock, prod.minStock);

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {prod.category}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-sky-50 text-sky-700 border border-sky-200">
                          {prod.itemType}
                        </span>
                        {prod.barcode && (
                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <Barcode className="w-3 h-3" /> {prod.barcode}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-extrabold text-slate-800 leading-snug">{prod.name}</h3>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">SKU: {prod.sku}</p>
                    </div>

                    {/* Stock Status Badge */}
                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-extrabold rounded-full border ${statusInfo.badge}`}>
                        {prod.stock <= 0 ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : prod.stock <= prod.minStock ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>{prod.stock} {prod.unit}</span>
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">Min. Stok: {prod.minStock}</p>
                    </div>
                  </div>

                  {/* Spec Specs & Location */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Ukuran / Specs:</span>
                      <span className="font-semibold text-slate-700">
                        {prod.metric} x {prod.length} ({prod.material}, {prod.grade})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500" /> Lokasi Rak:
                      </span>
                      <span className="font-bold text-slate-800">
                        {prod.warehouse} / {prod.rackLocation} / {prod.boxBin}
                      </span>
                    </div>
                  </div>

                  {/* 4 Tier Pricing Grid */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      4 Tier Harga Jual:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <span className="text-[10px] font-bold text-emerald-700 block">Harga Cash</span>
                        <span className="font-extrabold text-emerald-800">{formatRupiah(prod.cashPrice)}</span>
                      </div>
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl">
                        <span className="text-[10px] font-bold text-blue-700 block">Harga Tempo</span>
                        <span className="font-extrabold text-blue-800">{formatRupiah(prod.tempoPrice)}</span>
                      </div>
                      <div className="p-2 bg-purple-50 border border-purple-200 rounded-xl">
                        <span className="text-[10px] font-bold text-purple-700 block">Harga Retail</span>
                        <span className="font-extrabold text-purple-800">{formatRupiah(prod.retailPrice)}</span>
                      </div>
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl">
                        <span className="text-[10px] font-bold text-amber-700 block">Harga Grosir</span>
                        <span className="font-extrabold text-amber-800">{formatRupiah(prod.wholesalePrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenHistory(prod)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Riwayat Mutasi</span>
                    </button>

                    <button
                      onClick={() => setAddStockModalProduct(prod)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Tambah Stok</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Quick Add Stock */}
      {addStockModalProduct && (
        <Modal
          isOpen={!!addStockModalProduct}
          onClose={() => setAddStockModalProduct(null)}
          title={`Tambah Stok Quick: ${addStockModalProduct.name}`}
        >
          <form onSubmit={handleQuickAddStock} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Jumlah Tambahan Stok (Pcs)</label>
              <input
                type="number"
                min="1"
                value={addStockQty}
                onChange={(e) => setAddStockQty(Number(e.target.value))}
                className="w-full p-2.5 text-sm font-extrabold rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Catatan Penambahan</label>
              <input
                type="text"
                value={addStockNotes}
                onChange={(e) => setAddStockNotes(e.target.value)}
                className="w-full p-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <button
                type="button"
                onClick={() => setAddStockModalProduct(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
              >
                Simpan Penambahan Stok
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Riwayat Stok */}
      {historyModalProduct && (
        <Modal
          isOpen={!!historyModalProduct}
          onClose={() => setHistoryModalProduct(null)}
          title={`Riwayat Mutasi Stok: ${historyModalProduct.name}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="text-xs text-slate-500">
              SKU: <span className="font-bold text-slate-800">{historyModalProduct.sku}</span> | Stok Sekarang:{' '}
              <span className="font-bold text-emerald-600">{historyModalProduct.stock} Pcs</span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                  <tr>
                    <th className="py-2 px-3">Waktu</th>
                    <th className="py-2 px-3">Jenis</th>
                    <th className="py-2 px-3">Masuk</th>
                    <th className="py-2 px-3">Keluar</th>
                    <th className="py-2 px-3">Sisa Stok</th>
                    <th className="py-2 px-3">User</th>
                    <th className="py-2 px-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {productMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-[11px] text-slate-500">{new Date(m.timestamp).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 font-bold text-sky-700">{m.type}</td>
                      <td className="py-2 px-3 font-bold text-emerald-600">{m.qtyIn > 0 ? `+${m.qtyIn}` : '-'}</td>
                      <td className="py-2 px-3 font-bold text-rose-600">{m.qtyOut > 0 ? `-${m.qtyOut}` : '-'}</td>
                      <td className="py-2 px-3 font-extrabold text-slate-800">{m.stockAfter}</td>
                      <td className="py-2 px-3 text-slate-600">{m.userName}</td>
                      <td className="py-2 px-3 text-slate-500">{m.notes || '-'}</td>
                    </tr>
                  ))}
                  {productMovements.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        Belum ada mutasi stok recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
