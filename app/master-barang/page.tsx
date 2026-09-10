'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  FileSpreadsheet,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  UploadCloud,
  FileText,
} from 'lucide-react';
import { formatRupiah, getStockStatus } from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { generateAutoSku } from '@/lib/sku';
import * as XLSX from 'xlsx';

export default function MasterBarangPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Dynamic spec option lists (defaults + existing database values)
  const defaultCategories = ['Baut', 'Mur', 'Ring', 'Sekrup', 'Anchor', 'Pin & Clip', 'Klem', 'Stud Bolt', 'Fisher', 'Rivet'];
  const allCategories = Array.from(new Set([...defaultCategories, ...products.map((p) => p.category).filter(Boolean)])).sort();

  const defaultItemTypes = [
    'Hex Bolt FT (Full Thread)',
    'Hex Bolt HT (Half Thread)',
    'L Bolt / Socket Cap FT (Full Thread)',
    'L Bolt / Socket Cap HT (Half Thread)',
    'Flange Bolt FT (Full Thread)',
    'Flange Bolt HT (Half Thread)',
    'Stud Bolt FT (Full Thread)',
    'Stud Bolt HT (Half Thread)',
    'Heavy Hex Bolt FT',
    'Heavy Hex Bolt HT',
    'Carriage Bolt FT',
    'Carriage Bolt HT',
    'Cap Screw FT',
    'Cap Screw HT',
    'Hex Bolt',
    'L Bolt / Socket Cap',
    'Flange Bolt',
    'Nylon Lock Nut',
    'Hex Nut',
    'Wing Nut',
    'Flat Washer',
    'Spring Washer',
    'Self Tapping Screw',
    'Drywall Screw',
    'Anchor Bolt',
    'Stud Bolt',
    'Roofing Screw',
    'U-Bolt',
    'Eye Bolt',
  ];
  const allItemTypes = Array.from(new Set([...defaultItemTypes, ...products.map((p) => p.itemType).filter(Boolean)])).sort();

  const defaultMetrics = [
    // Metric (mm)
    'M2', 'M2.5', 'M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M14', 'M16', 'M18', 'M20', 'M22', 'M24', 'M27', 'M30', 'M33', 'M36', 'M42', 'M48',
    // UNC (Coarse Inch)
    '1/4" UNC', '5/16" UNC', '3/8" UNC', '7/16" UNC', '1/2" UNC', '9/16" UNC', '5/8" UNC', '3/4" UNC', '7/8" UNC', '1" UNC', '1-1/8" UNC', '1-1/4" UNC', '1-1/2" UNC',
    // UNF (Fine Inch)
    '1/4" UNF', '5/16" UNF', '3/8" UNF', '7/16" UNF', '1/2" UNF', '9/16" UNF', '5/8" UNF', '3/4" UNF', '7/8" UNF', '1" UNF', '1-1/8" UNF', '1-1/4" UNF', '1-1/2" UNF',
    // BSW Inch
    'BSW 1/4"', 'BSW 5/16"', 'BSW 3/8"', 'BSW 1/2"', 'BSW 5/8"', 'BSW 3/4"', 'BSW 7/8"', 'BSW 1"',
  ];
  const allMetrics = Array.from(new Set([...defaultMetrics, ...products.map((p) => p.metric).filter(Boolean)])).sort();

  const defaultLengths = [
    // Millimeter (mm)
    '5 mm', '8 mm', '10 mm', '12 mm', '15 mm', '20 mm', '25 mm', '30 mm', '35 mm', '40 mm', '45 mm', '50 mm', '60 mm', '70 mm', '80 mm', '90 mm', '100 mm', '120 mm', '150 mm', '200 mm',
    // Inch (")
    '1/4"', '3/8"', '1/2"', '5/8"', '3/4"', '7/8"', '1"', '1-1/4"', '1-1/2"', '1-3/4"', '2"', '2-1/2"', '3"', '3-1/2"', '4"', '4-1/2"', '5"', '6"', '8"', '10"', '12"',
  ];
  const allLengths = Array.from(new Set([...defaultLengths, ...products.map((p) => p.length).filter(Boolean)])).sort();

  const defaultMaterials = ['Baja Karbon', 'Stainless Steel 304', 'Stainless Steel 316', 'Kuningan', 'Aluminum', 'Nylon', 'Besi S45C'];
  const allMaterials = Array.from(new Set([...defaultMaterials, ...products.map((p) => p.material).filter(Boolean)])).sort();

  const defaultGrades = ['4.8', '8.8', '10.9', '12.9', 'A2-70', 'A4-80', 'Class 8', 'Class 10', 'SS 304', 'SS 316'];
  const allGrades = Array.from(new Set([...defaultGrades, ...products.map((p) => p.grade).filter(Boolean)])).sort();

  const defaultFinishings = ['Zinc Plating', 'Black Oxide', 'Galvanized (HDG)', 'Polished', 'Yellow Zinc', 'Plain / Polos', 'Chrome'];
  const allFinishings = Array.from(new Set([...defaultFinishings, ...products.map((p) => p.finishing).filter(Boolean)])).sort();

  // Custom typing toggles for each attribute
  const [customFields, setCustomFields] = useState<{ [key: string]: boolean }>({
    category: false,
    itemType: false,
    metric: false,
    length: false,
    material: false,
    grade: false,
    finishing: false,
  });

  // Excel Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importValidation, setImportValidation] = useState<any | null>(null);
  const [importRawRows, setImportRawRows] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Confirm Delete Dialog
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Baut',
    itemType: 'Hex Bolt',
    metric: 'M8',
    length: '100 mm',
    material: 'Baja Karbon',
    grade: '8.8',
    finishing: 'Zinc Plating',
    unit: 'Pcs',
    pcsPerBox: 100,
    warehouse: 'Gudang Utama',
    rackLocation: 'Rak A',
    boxBin: 'A-01',
    stock: 0,
    minStock: 10,
    buyPrice: 0,
    cashPrice: 0,
    tempoPrice: 0,
    retailPrice: 0,
    wholesalePrice: 0,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const resetCustomFields = () => {
    setCustomFields({
      category: false,
      itemType: false,
      metric: false,
      length: false,
      material: false,
      grade: false,
      finishing: false,
    });
  };

  const renderSpecField = (
    fieldKey: string,
    label: string,
    optionsList: string[],
    placeholderText: string
  ) => {
    const isCustom = customFields[fieldKey];
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block font-bold text-slate-700 text-xs">{label}</label>
          <button
            type="button"
            onClick={() => setCustomFields((prev) => ({ ...prev, [fieldKey]: !isCustom }))}
            className="text-[10px] font-bold text-sky-600 hover:text-sky-700 hover:underline"
          >
            {isCustom ? '← Pilih Dropdown' : '+ Ketik Baru'}
          </button>
        </div>
        {isCustom ? (
          <input
            type="text"
            placeholder={placeholderText}
            value={(formData as any)[fieldKey]}
            onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-sky-400 font-bold bg-sky-50/50 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none text-xs"
            required
          />
        ) : (
          <select
            value={(formData as any)[fieldKey]}
            onChange={(e) => {
              if (e.target.value === '__NEW__') {
                setCustomFields((prev) => ({ ...prev, [fieldKey]: true }));
                setFormData({ ...formData, [fieldKey]: '' });
              } else {
                setFormData({ ...formData, [fieldKey]: e.target.value });
              }
            }}
            className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none text-xs"
          >
            {optionsList.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            <option value="__NEW__" className="font-bold text-sky-600">
              + Tambah {label} Baru...
            </option>
          </select>
        )}
      </div>
    );
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    resetCustomFields();
    setFormData({
      sku: '',
      name: '',
      category: 'Baut',
      itemType: 'Hex Bolt FT (Full Thread)',
      metric: 'M8',
      length: '50 mm',
      material: 'Baja Karbon',
      grade: '8.8',
      finishing: 'Zinc Plating',
      unit: 'Pcs',
      pcsPerBox: 100,
      warehouse: 'Gudang Utama',
      rackLocation: 'Rak A',
      boxBin: 'A-01',
      stock: 50,
      minStock: 10,
      buyPrice: 1500,
      cashPrice: 2200,
      tempoPrice: 2400,
      retailPrice: 2600,
      wholesalePrice: 1900,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: any) => {
    setEditingProduct(prod);
    resetCustomFields();
    setFormData({
      sku: prod.sku,
      name: prod.name,
      category: prod.category,
      itemType: prod.itemType,
      metric: prod.metric,
      length: prod.length,
      material: prod.material,
      grade: prod.grade,
      finishing: prod.finishing,
      unit: prod.unit,
      pcsPerBox: prod.pcsPerBox,
      warehouse: prod.warehouse,
      rackLocation: prod.rackLocation,
      boxBin: prod.boxBin,
      stock: prod.stock,
      minStock: prod.minStock,
      buyPrice: prod.buyPrice,
      cashPrice: prod.cashPrice,
      tempoPrice: prod.tempoPrice,
      retailPrice: prod.retailPrice,
      wholesalePrice: prod.wholesalePrice,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const finalFormData = {
        ...formData,
        sku: formData.sku && formData.sku.trim() !== '' ? formData.sku.trim() : generateAutoSku(formData),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalFormData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan produk');
      }

      showToast(
        editingProduct
          ? `Produk ${formData.name} berhasil diperbarui!`
          : `Produk ${formData.name} berhasil ditambahkan!`,
        'success'
      );
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus barang');
      showToast(`Produk ${deletingProduct.name} berhasil dinonaktifkan`, 'success');
      setDeletingProduct(null);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Excel File Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws);

        setImportRawRows(data);

        // Validate via API
        const res = await fetch('/api/products/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: data, action: 'validate' }),
        });

        const valResult = await res.json();
        setImportValidation(valResult);
      } catch (err) {
        showToast('Gagal membaca file Excel', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCommitImport = async () => {
    if (!importRawRows.length) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: importRawRows, action: 'commit' }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal import produk');

      showToast(`Berhasil mengimpor ${result.count} produk ke database!`, 'success');
      setIsImportModalOpen(false);
      setImportValidation(null);
      setImportRawRows([]);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Pagination slicing
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-sky-600" />
            <span>Master Barang & Katalog Produk</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola SKU, spesifikasi fastener, 4-tier pricing, lokasi gudang, & import Excel.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import Excel</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all shadow-md shadow-sky-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang Baru</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Cari SKU, nama barang, barcode, atau kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-xs font-semibold focus:outline-none"
        />
      </div>

      {/* Products Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Nama Produk & Specs</th>
                <th className="py-3 px-4">Lokasi Gudang</th>
                <th className="py-3 px-4 text-center">Stok / Min</th>
                <th className="py-3 px-4 text-right">Harga Beli</th>
                <th className="py-3 px-4 text-right">Harga Cash</th>
                <th className="py-3 px-4 text-right">Harga Grosir</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.map((prod) => {
                const statusInfo = getStockStatus(prod.stock, prod.minStock);

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-sky-700">{prod.sku}</div>
                      <div className="text-[10px] font-mono text-slate-400">{prod.barcode || '-'}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-800">{prod.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {prod.category} | {prod.itemType} | {prod.metric} x {prod.length} | {prod.material}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{prod.warehouse}</div>
                      <div className="text-[10px] text-slate-400">{prod.rackLocation} / {prod.boxBin}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${statusInfo.badge}`}>
                        {prod.stock} {prod.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-600">
                      {formatRupiah(prod.buyPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                      {formatRupiah(prod.cashPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-amber-700">
                      {formatRupiah(prod.wholesalePrice)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingProduct(prod)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada produk ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={products.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingProduct ? `Edit Barang: ${editingProduct.sku}` : 'Tambah Barang Baru'}
          maxWidth="4xl"
        >
          <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">
                  SKU Produk <span className="font-normal text-slate-500 text-[10px]">(Opsional / Auto)</span>
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Kosongkan untuk generate SKU otomatis dari spesifikasi"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none text-xs"
                />
                {!formData.sku && (
                  <p className="text-[10px] text-sky-600 font-medium mt-1 truncate">
                    💡 Auto SKU: <span className="font-mono font-bold bg-sky-50 px-1 py-0.5 rounded border border-sky-200 text-sky-700">{generateAutoSku(formData)}</span>
                  </p>
                )}
              </div>

              {renderSpecField('category', 'Kategori', allCategories, 'Ketik kategori baru (misal: Klem, Stud Bolt, Fisher)...')}
              {renderSpecField('itemType', 'Jenis Barang', allItemTypes, 'Ketik jenis barang baru (misal: Hex Bolt, Lock Nut)...')}
              {renderSpecField('metric', 'Metric (Diameter)', allMetrics, 'Ketik diameter metric baru (misal: M8, M10, 1/2")...')}
              {renderSpecField('length', 'Panjang (mm / size)', allLengths, 'Ketik panjang baru (misal: 50 mm, 100 mm)...')}
              {renderSpecField('material', 'Material / Bahan', allMaterials, 'Ketik material baru (misal: Stainless Steel 304)...')}
              {renderSpecField('grade', 'Grade / Kelas', allGrades, 'Ketik grade/kelas baru (misal: 8.8, 10.9, A2-70)...')}
              {renderSpecField('finishing', 'Finishing / Lapisan', allFinishings, 'Ketik finishing baru (misal: Zinc Plating, Black Oxide)...')}
            </div>

            {/* Nama Produk Auto */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Produk (Auto Spec)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Kosongkan jika ingin digenerate otomatis dari spesifikasi"
                className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Stok & Lokasi */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Stok Awal</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-slate-200 font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Stok Minimum</label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-slate-200 font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Gudang</label>
                <input
                  type="text"
                  value={formData.warehouse}
                  onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Rak / Box Bin</label>
                <input
                  type="text"
                  value={formData.rackLocation}
                  onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 4 Price Tiers & Buy Price */}
            <div>
              <span className="block font-bold text-slate-800 mb-2">Penetapan Harga (Modal & 4 Price Tiers):</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Harga Beli (Modal)</label>
                  <input
                    type="number"
                    value={formData.buyPrice}
                    onChange={(e) => setFormData({ ...formData, buyPrice: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-200 font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-700 mb-1">Harga Cash</label>
                  <input
                    type="number"
                    value={formData.cashPrice}
                    onChange={(e) => setFormData({ ...formData, cashPrice: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-emerald-300 font-bold text-emerald-800 bg-emerald-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-blue-700 mb-1">Harga Tempo</label>
                  <input
                    type="number"
                    value={formData.tempoPrice}
                    onChange={(e) => setFormData({ ...formData, tempoPrice: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-blue-300 font-bold text-blue-800 bg-blue-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-purple-700 mb-1">Harga Retail</label>
                  <input
                    type="number"
                    value={formData.retailPrice}
                    onChange={(e) => setFormData({ ...formData, retailPrice: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-purple-300 font-bold text-purple-800 bg-purple-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-700 mb-1">Harga Grosir</label>
                  <input
                    type="number"
                    value={formData.wholesalePrice}
                    onChange={(e) => setFormData({ ...formData, wholesalePrice: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-amber-300 font-bold text-amber-800 bg-amber-50/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-extrabold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md"
              >
                Simpan Produk
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Excel Import Modal */}
      {isImportModalOpen && (
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => {
            setIsImportModalOpen(false);
            setImportValidation(null);
          }}
          title="Import Produk dari File Excel"
          maxWidth="3xl"
        >
          <div className="space-y-5 text-xs">
            {/* Step 1: File Upload */}
            <div className="border-2 border-dashed border-slate-300 p-6 rounded-2xl text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <UploadCloud className="w-10 h-10 text-sky-500 mx-auto mb-2" />
              <p className="font-bold text-slate-700">Upload File Spreadsheet (.xlsx / .csv)</p>
              <p className="text-[11px] text-slate-400 mt-1 mb-3">
                Kolom Excel: SKU, Kategori, Jenis, Metric, Panjang, Material, Grade, Finishing, Satuan, Stok, Harga Beli, Harga Cash, Harga Tempo, Harga Retail, Harga Grosir, Lokasi.
              </p>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-600 file:text-white hover:file:bg-sky-500 cursor-pointer"
              />
            </div>

            {/* Step 2: Validation Summary Screen */}
            {importValidation && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-emerald-700 block uppercase">Data Valid</span>
                    <span className="text-xl font-black text-emerald-800">{importValidation.validRows?.length || 0}</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-amber-700 block uppercase">Duplikat SKU</span>
                    <span className="text-xl font-black text-amber-800">{importValidation.duplicateRows?.length || 0}</span>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-rose-700 block uppercase">Jumlah Error</span>
                    <span className="text-xl font-black text-rose-800">{importValidation.errorRows?.length || 0}</span>
                  </div>
                </div>

                {/* Detail Error Table */}
                {(importValidation.errorRows?.length > 0 || importValidation.duplicateRows?.length > 0) && (
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-48 overflow-y-auto">
                    <h4 className="font-bold text-rose-700 mb-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Detail Baris Error & Duplikat:
                    </h4>
                    <ul className="space-y-1 text-[11px] text-slate-600">
                      {importValidation.errorRows?.map((err: any, idx: number) => (
                        <li key={idx} className="text-rose-600 font-semibold">
                          Baris {err.rowNumber} (SKU: {err.sku}): {err.reason}
                        </li>
                      ))}
                      {importValidation.duplicateRows?.map((dup: any, idx: number) => (
                        <li key={idx} className="text-amber-700 font-semibold">
                          Baris {dup.rowNumber} (SKU: {dup.sku}): {dup.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end gap-2 border-t pt-3">
                  <button
                    type="button"
                    onClick={() => setImportValidation(null)}
                    className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleCommitImport}
                    disabled={isImporting || importValidation.validRows?.length === 0}
                    className="px-5 py-2 font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl shadow-md"
                  >
                    {isImporting ? 'Mengimpor...' : `Konfirmasi Import (${importValidation.validRows?.length} Data Valid)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deletingProduct && (
        <ConfirmDialog
          isOpen={!!deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onConfirm={handleDeleteProduct}
          title="Nonaktifkan Produk"
          message={`Apakah Anda yakin ingin menonaktifkan produk ${deletingProduct.name} (${deletingProduct.sku})?`}
          isDangerous={true}
        />
      )}
    </div>
  );
}
