'use client';

import React, { useState, useEffect } from 'react';
import { Barcode, Printer, Search, Check } from 'lucide-react';
import { formatRupiah } from '@/lib/formatters';

export default function BarcodePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data.products || []);
        if (data.products?.length > 0) {
          setSelectedProductIds(data.products.slice(0, 4).map((p: any) => p.id));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadProducts();
  }, []);

  const toggleSelect = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((item) => item !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));
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
            <Barcode className="w-6 h-6 text-sky-600" />
            <span>Generate & Cetak Label Barcode</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pilih produk untuk mencetak label stiker barcode dengan info spesifikasi & harga jual.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          disabled={selectedProducts.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-40"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Label Stiker ({selectedProducts.length})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Product Picker */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari baut untuk cetak label..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-xs font-semibold focus:outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const isSelected = selectedProductIds.includes(p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => toggleSelect(p.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-sky-50 border-sky-500 text-sky-950 font-bold'
                      : 'bg-white border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-extrabold">{p.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">
                      SKU: {p.sku} | Barcode: {p.barcode || 'Auto'}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                      isSelected ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Printable Labels Sheet Preview */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 border-b pb-2">
            Pratinjau Layout Label Stiker Barcode
          </h3>

          <div id="printable-area" className="grid grid-cols-2 gap-4">
            {selectedProducts.map((p) => (
              <div
                key={p.id}
                className="border-2 border-dashed border-slate-300 p-3 rounded-xl bg-slate-50 flex flex-col justify-between text-center space-y-2"
              >
                <div>
                  <h4 className="font-extrabold text-[11px] text-slate-900 line-clamp-1">{p.name}</h4>
                  <p className="text-[9px] font-bold text-slate-500">
                    {p.metric} x {p.length} | {p.material}
                  </p>
                </div>

                {/* Simulated Barcode Graphics */}
                <div className="my-1 bg-white p-2 rounded border border-slate-200 flex flex-col items-center">
                  <div className="w-full h-9 flex justify-center items-center gap-0.5">
                    {Array.from({ length: 32 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-full ${
                          idx % 3 === 0 ? 'w-1 bg-slate-900' : idx % 5 === 0 ? 'w-1.5 bg-slate-900' : 'w-0.5 bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[9px] font-bold text-slate-700 mt-1">
                    *{p.barcode || p.sku}*
                  </span>
                </div>

                <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-800 pt-1 border-t border-slate-200">
                  <span className="font-mono">{p.sku}</span>
                  <span className="text-sky-700 font-black">{formatRupiah(p.cashPrice)}</span>
                </div>
              </div>
            ))}

            {selectedProducts.length === 0 && (
              <div className="col-span-2 py-12 text-center text-slate-400 text-xs">
                Pilih produk di sebelah kiri untuk menampilkan label stiker barcode
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
