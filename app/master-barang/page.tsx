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
  Copy,
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

  // User Preset 5 Spec Lists
  const defaultMaterialGrades = [
    'GR 4.6',
    'GR 8.8',
    'SUS 304',
    'SUS 316',
  ];
  const allMaterialGrades = Array.from(
    new Set([
      ...defaultMaterialGrades,
      ...products.map((p) => p.materialGrade || `${p.material || ''} ${p.grade || ''}`.trim()).filter(Boolean),
    ])
  );

  const defaultThreads = [
    'FT',
    'HT',
  ];
  const allThreads = Array.from(
    new Set([...defaultThreads, ...products.map((p) => p.thread || p.metric).filter(Boolean)])
  );

  const defaultItemTypes = [
    'Baut Mur Hex M.5-P0.80-K8',
    'Baut Mur Hex M.6-P1.00-K10',
    'Baut Mur Hex M.8-P1.25-K13',
    'Baut Mur Hex M.10-P1.50-K17',
    'Baut Mur Hex M.12-P1.75-K19',
    'Baut Mur Hex M.14-P2.00-K22',
    'Baut Mur Hex M.16-P2.00-K24',
    'Baut Mur Hex M.18-P2.50-K27',
    'Baut Mur Hex M.20-P2.50-K30',
    'Baut Mur Hex M.22-P2.50-K32',
    'Baut Mur Hex M.24-P3.00-K36',
    'Baut Mur Hex M.27-P3.00-K41',
    'Baut Mur Hex M.30-P3.50-K46',
    'Baut Mur Hex M.33-P3.50-K50',
    'Baut Mur Hex M.36-P4.00-K55',
    'Baut Mur Hex M.42-P4.50-K55',
  ];
  const allItemTypes = Array.from(new Set([...defaultItemTypes, ...products.map((p) => p.itemType).filter(Boolean)]));

  const defaultLengths = [
    '8 MM',
    '10 MM',
    '12 MM',
    '16 MM',
    '20 MM',
    '25 MM',
    '30 MM',
    '35 MM',
    '40 MM',
    '45 MM',
    '50 MM',
    '55 MM',
    '60 MM',
    '65 MM',
    '70 MM',
    '75 MM',
    '80 MM',
    '85 MM',
    '90 MM',
    '95 MM',
    '100 MM',
    '110 MM',
    '120 MM',
    '125 MM',
    '130 MM',
    '140 MM',
    '150 MM',
    '160 MM',
    '170 MM',
    '180 MM',
    '190 MM',
    '200 MM',
  ];
  const allLengths = Array.from(new Set([...defaultLengths, ...products.map((p) => p.length).filter(Boolean)]));

  const defaultFinishings = [
    'HTM',
    'PTH',
    'KNG',
    'UCP',
    'HDG',
  ];
  const allFinishings = Array.from(new Set([...defaultFinishings, ...products.map((p) => p.finishing).filter(Boolean)]));

  // Hidden/removed options state (persisted in localStorage)
  const [hiddenOptions, setHiddenOptions] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bautstock_hidden_spec_options');
      if (saved) {
        setHiddenOptions(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const filteredMaterialGrades = allMaterialGrades.filter((opt) => !(hiddenOptions.materialGrade || []).includes(opt));
  const filteredThreads = allThreads.filter((opt) => !(hiddenOptions.thread || []).includes(opt));
  const filteredItemTypes = allItemTypes.filter((opt) => !(hiddenOptions.itemType || []).includes(opt));
  const filteredLengths = allLengths.filter((opt) => !(hiddenOptions.length || []).includes(opt));
  const filteredFinishings = allFinishings.filter((opt) => !(hiddenOptions.finishing || []).includes(opt));

  // Custom typing toggles for each attribute
  const [customFields, setCustomFields] = useState<{ [key: string]: boolean }>({
    materialGrade: false,
    thread: false,
    itemType: false,
    length: false,
    finishing: false,
  });

  // Excel Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importValidation, setImportValidation] = useState<any | null>(null);
  const [importRawRows, setImportRawRows] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Confirm Delete Dialogs
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);
  const [deletingOption, setDeletingOption] = useState<{ fieldKey: string; optionValue: string; label: string } | null>(null);

  // Form State (5 main spec fields)
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    materialGrade: 'GR 4.6',
    thread: 'FT',
    itemType: 'Baut Mur Hex M.5-P0.80-K8',
    length: '8 MM',
    finishing: 'HTM',
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
      materialGrade: false,
      thread: false,
      itemType: false,
      length: false,
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
    const currentValue = (formData as any)[fieldKey];

    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block font-bold text-slate-700 text-xs">{label}</label>
          <div className="flex items-center gap-2">
            {!isCustom && currentValue && (
              <button
                type="button"
                onClick={() => setDeletingOption({ fieldKey, optionValue: currentValue, label })}
                title={`Hapus "${currentValue}" dari daftar ${label}`}
                className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-0.5 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Hapus Opsi</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setCustomFields((prev) => ({ ...prev, [fieldKey]: !isCustom }))}
              className="text-[10px] font-bold text-sky-600 hover:text-sky-700 hover:underline"
            >
              {isCustom ? '← Pilih Dropdown' : '+ Ketik Baru'}
            </button>
          </div>
        </div>
        {isCustom ? (
          <input
            type="text"
            placeholder={placeholderText}
            value={currentValue}
            onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-sky-400 font-bold bg-sky-50/50 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none text-xs"
            required
          />
        ) : (
          <select
            value={currentValue}
            onChange={(e) => {
              if (e.target.value === '__NEW__') {
                setCustomFields((prev) => ({ ...prev, [fieldKey]: true }));
                setFormData({ ...formData, [fieldKey]: '' });
              } else if (e.target.value === '__DELETE__') {
                setDeletingOption({ fieldKey, optionValue: currentValue, label });
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
            {currentValue && (
              <option value="__DELETE__" className="font-bold text-rose-600">
                🗑️ Hapus Opsi Terpilih ({currentValue})...
              </option>
            )}
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
      materialGrade: 'GR 4.6',
      thread: 'FT',
      itemType: 'Baut Mur Hex M.5-P0.80-K8',
      length: '8 MM',
      finishing: 'HTM',
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
      materialGrade: prod.materialGrade || `${prod.material || ''} ${prod.grade || ''}`.trim() || 'GR 4.6',
      thread: prod.thread || prod.metric || 'FT',
      itemType: prod.itemType || 'Baut Mur Hex M.5-P0.80-K8',
      length: prod.length || '8 MM',
      finishing: prod.finishing || 'HTM',
      unit: prod.unit || 'Pcs',
      pcsPerBox: prod.pcsPerBox || 100,
      warehouse: prod.warehouse || 'Gudang Utama',
      rackLocation: prod.rackLocation || 'Rak A',
      boxBin: prod.boxBin || 'A-01',
      stock: prod.stock || 0,
      minStock: prod.minStock || 10,
      buyPrice: prod.buyPrice || 0,
      cashPrice: prod.cashPrice || 0,
      tempoPrice: prod.tempoPrice || 0,
      retailPrice: prod.retailPrice || 0,
      wholesalePrice: prod.wholesalePrice || 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenDuplicateModal = (prod: any) => {
    setEditingProduct(null);
    resetCustomFields();
    setFormData({
      sku: '',
      name: '',
      materialGrade: prod.materialGrade || `${prod.material || ''} ${prod.grade || ''}`.trim() || 'GR 4.6',
      thread: prod.thread || prod.metric || 'FT',
      itemType: prod.itemType || 'Baut Mur Hex M.5-P0.80-K8',
      length: prod.length || '8 MM',
      finishing: prod.finishing || 'HTM',
      unit: prod.unit || 'Pcs',
      pcsPerBox: prod.pcsPerBox || 100,
      warehouse: prod.warehouse || 'Gudang Utama',
      rackLocation: prod.rackLocation || 'Rak A',
      boxBin: prod.boxBin || 'A-01',
      stock: prod.stock || 0,
      minStock: prod.minStock || 10,
      buyPrice: prod.buyPrice || 0,
      cashPrice: prod.cashPrice || 0,
      tempoPrice: prod.tempoPrice || 0,
      retailPrice: prod.retailPrice || 0,
      wholesalePrice: prod.wholesalePrice || 0,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      // Order: MATL THREAD JENIS_BARANG PANJANG FINISHING
      const autoName = `${formData.materialGrade} ${formData.thread} ${formData.itemType} ${formData.length} ${formData.finishing}`.replace(/\s+/g, ' ').trim();

      const finalFormData = {
        ...formData,
        sku: formData.sku && formData.sku.trim() !== '' ? formData.sku.trim() : generateAutoSku(formData),
        name: formData.name && formData.name.trim() !== '' ? formData.name.trim() : autoName,
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
          ? `Produk ${finalFormData.name} berhasil diperbarui!`
          : `Produk ${finalFormData.name} berhasil ditambahkan!`,
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
            Kelola SKU, spesifikasi 5 dropdown, harga retail & grosir, lokasi gudang, & import Excel.
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
          placeholder="Cari SKU, nama barang, atau kata kunci spesifikasi..."
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
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Nama Produk & Specs</th>
                <th className="py-3 px-4">Lokasi Gudang</th>
                <th className="py-3 px-4 text-center">Stok / Min</th>
                <th className="py-3 px-4 text-right">Harga Retail</th>
                <th className="py-3 px-4 text-right">Harga Grosir</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.map((prod) => {
                const statusInfo = getStockStatus(prod.stock, prod.minStock);
                const matGradeText = prod.materialGrade || `${prod.material || ''} ${prod.grade || ''}`.trim();
                const threadText = prod.thread || prod.metric || '-';

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-sky-700">{prod.sku}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-800">{prod.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {matGradeText} | {threadText} | {prod.itemType} | {prod.length} | {prod.finishing}
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
                    <td className="py-3 px-4 text-right font-extrabold text-purple-700">
                      {formatRupiah(prod.retailPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-amber-700">
                      {formatRupiah(prod.wholesalePrice)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenDuplicateModal(prod)}
                          title="Duplikat Barang"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          title="Edit Barang"
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingProduct(prod)}
                          title="Hapus / Nonaktifkan Barang"
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
                  <td colSpan={7} className="py-12 text-center text-slate-400">
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

              {/* 5 Specification Dropdown Menus in exact order */}
              {renderSpecField('materialGrade', 'Material/Grade', filteredMaterialGrades, 'Ketik Material/Grade baru (misal: GR 4.6, SUS 304)...')}
              {renderSpecField('thread', 'Thread', filteredThreads, 'Ketik Thread baru (misal: FT, HT)...')}
              {renderSpecField('itemType', 'Jenis Barang', filteredItemTypes, 'Ketik Jenis Barang baru (misal: Baut Mur Hex M.5-P0.80-K8)...')}
              {renderSpecField('length', 'Panjang', filteredLengths, 'Ketik Panjang baru (misal: 8 MM, 50 MM)...')}
              {renderSpecField('finishing', 'Finishing', filteredFinishings, 'Ketik Finishing baru (misal: HTM, HDG)...')}
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
              {!formData.name && (
                <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">
                  💡 Auto Nama: <span className="font-bold text-slate-700">{`${formData.materialGrade} ${formData.thread} ${formData.itemType} ${formData.length} ${formData.finishing}`.replace(/\s+/g, ' ').trim()}</span>
                </p>
              )}
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

            {/* 2 Price Tiers & Buy Price */}
            <div>
              <span className="block font-bold text-slate-800 mb-2">Penetapan Harga (Modal, Retail & Grosir):</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Harga Beli (Modal)</label>
                  <input
                    type="number"
                    value={formData.buyPrice}
                    onChange={(e) => setFormData({ ...formData, buyPrice: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-purple-700 mb-1">Harga Retail</label>
                  <input
                    type="number"
                    value={formData.retailPrice}
                    onChange={(e) => setFormData({ ...formData, retailPrice: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-purple-300 font-bold text-purple-800 bg-purple-50/50 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-700 mb-1">Harga Grosir</label>
                  <input
                    type="number"
                    value={formData.wholesalePrice}
                    onChange={(e) => setFormData({ ...formData, wholesalePrice: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-amber-300 font-bold text-amber-800 bg-amber-50/50 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                Kolom Excel: SKU, Material/Grade, Thread, Jenis Barang, Panjang, Finishing, Satuan, Stok, Harga Beli, Harga Retail, Harga Grosir, Lokasi.
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

      {/* Delete Option Confirmation */}
      {deletingOption && (
        <ConfirmDialog
          isOpen={!!deletingOption}
          onClose={() => setDeletingOption(null)}
          onConfirm={() => {
            const { fieldKey, optionValue, label } = deletingOption;
            setHiddenOptions((prev) => {
              const currentList = prev[fieldKey] || [];
              if (currentList.includes(optionValue)) return prev;
              const updatedList = [...currentList, optionValue];
              const updated = { ...prev, [fieldKey]: updatedList };
              try {
                localStorage.setItem('bautstock_hidden_spec_options', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });

            const remainingOptions = (
              fieldKey === 'materialGrade' ? allMaterialGrades :
              fieldKey === 'thread' ? allThreads :
              fieldKey === 'itemType' ? allItemTypes :
              fieldKey === 'length' ? allLengths :
              fieldKey === 'finishing' ? allFinishings : []
            ).filter((opt) => opt !== optionValue && !(hiddenOptions[fieldKey] || []).includes(opt));

            setFormData((prev) => ({
              ...prev,
              [fieldKey]: remainingOptions[0] || '',
            }));

            showToast(`Opsi "${optionValue}" berhasil dihapus dari daftar ${label}`, 'success');
            setDeletingOption(null);
          }}
          title={`Hapus Opsi ${deletingOption.label}`}
          message={`Apakah Anda yakin ingin menghapus opsi "${deletingOption.optionValue}" dari daftar dropdown ${deletingOption.label}?`}
          isDangerous={true}
        />
      )}
    </div>
  );
}
