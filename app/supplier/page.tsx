'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit, Trash2, Phone, MapPin, UserCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function SupplierPage() {
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    address: '',
    notes: '',
  });

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`/api/suppliers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setSuppliers(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      code: `SUP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      contactPerson: '',
      phone: '',
      address: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (s: any) => {
    setEditingSupplier(s);
    setFormData({
      code: s.code,
      name: s.name,
      contactPerson: s.contactPerson,
      phone: s.phone,
      address: s.address,
      notes: s.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan supplier');
      }

      showToast(`Supplier ${formData.name} berhasil disimpan!`, 'success');
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteSupplier = async () => {
    if (!deletingSupplier) return;
    try {
      const res = await fetch(`/api/suppliers/${deletingSupplier.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus supplier');
      showToast(`Data supplier ${deletingSupplier.name} berhasil dihapus!`, 'success');
      setDeletingSupplier(null);
      fetchSuppliers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-sky-600" />
            <span>Manajemen Supplier</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data distributor & pabrik pemasok baut, contact person, dan riwayat pasokan.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all shadow-md shadow-sky-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Supplier</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama supplier, kode SUP, contact person..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-xs font-semibold focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                <span className="font-extrabold text-sky-700 text-xs font-mono">{s.code}</span>
              </div>

              <h3 className="font-extrabold text-base text-slate-800 mt-2">{s.name}</h3>

              <div className="space-y-1 mt-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">CP: {s.contactPerson}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{s.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="line-clamp-1">{s.address}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => handleOpenEditModal(s)}
                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Supplier
              </button>
              <button
                onClick={() => setDeletingSupplier(s)}
                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                title="Hapus Supplier"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Tambah Supplier Baru'}
        >
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kode Supplier</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full p-2 rounded-xl border font-mono font-bold"
                readOnly={!!editingSupplier}
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Perusahaan / Supplier</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 rounded-xl border font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Person (CP)</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full p-2 rounded-xl border font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. Telp / HP</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 rounded-xl border font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat Kantor / Pabrik</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full p-2 rounded-xl border font-semibold"
              />
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
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
                Simpan Supplier
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deletingSupplier && (
        <ConfirmDialog
          isOpen={!!deletingSupplier}
          onClose={() => setDeletingSupplier(null)}
          onConfirm={handleDeleteSupplier}
          title="Hapus Supplier"
          message={`Apakah Anda yakin ingin menghapus supplier ${deletingSupplier.name} (${deletingSupplier.code}) secara permanen? Data supplier akan dihapus dari database.`}
          isDangerous={true}
        />
      )}
    </div>
  );
}
