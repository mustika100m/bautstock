'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, Phone, MapPin } from 'lucide-react';
import { formatRupiah } from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function PelangganPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phone: '',
    address: '',
    customerType: 'RETAIL',
    creditLimit: 0,
    paymentTermsDays: 14,
    notes: '',
  });

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setCustomers(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      code: `PLG-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      phone: '',
      address: '',
      customerType: 'RETAIL',
      creditLimit: 5000000,
      paymentTermsDays: 14,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: any) => {
    setEditingCustomer(c);
    setFormData({
      code: c.code,
      name: c.name,
      phone: c.phone,
      address: c.address,
      customerType: c.customerType,
      creditLimit: c.creditLimit,
      paymentTermsDays: c.paymentTermsDays,
      notes: c.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan data pelanggan');
      }

      showToast(`Pelanggan ${formData.name} berhasil disimpan!`, 'success');
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    try {
      const res = await fetch(`/api/customers/${deletingCustomer.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus pelanggan');
      showToast(`Data pelanggan ${deletingCustomer.name} berhasil dihapus!`, 'success');
      setDeletingCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" />
            <span>Manajemen Pelanggan</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Database pembeli toko baut, penetapan tipe pelanggan (Grosir/Retail/Tempo), limit kredit, & termin bayar.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all shadow-md shadow-sky-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama pelanggan, kode PLG, no HP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-xs font-semibold focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                <span className="font-extrabold text-sky-700 text-xs font-mono">{c.code}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-200">
                  Tipe: {c.customerType}
                </span>
              </div>

              <h3 className="font-extrabold text-base text-slate-800 mt-2">{c.name}</h3>

              <div className="space-y-1 mt-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="line-clamp-1">{c.address}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                <span className="text-slate-500 font-semibold">Limit Kredit:</span>
                <span className="font-extrabold text-slate-800">{formatRupiah(c.creditLimit)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Termin Bayar:</span>
                <span className="font-bold text-sky-600">{c.paymentTermsDays} Hari</span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => handleOpenEditModal(c)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Pelanggan
                </button>
                <button
                  onClick={() => setDeletingCustomer(c)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                  title="Hapus Pelanggan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCustomer ? `Edit Pelanggan: ${editingCustomer.name}` : 'Tambah Pelanggan Baru'}
        >
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode Pelanggan</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full p-2 rounded-xl border font-mono font-bold"
                  readOnly={!!editingCustomer}
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipe Pelanggan</label>
                <select
                  value={formData.customerType}
                  onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                  className="w-full p-2 rounded-xl border font-bold"
                >
                  <option value="RETAIL">RETAIL (Eceran)</option>
                  <option value="GROSIR">GROSIR (Otomatis Harga Grosir)</option>
                  <option value="TEMPO">TEMPO (Kredit Proyek)</option>
                  <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Pelanggan / PT / Bengkel</label>
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
                <label className="block font-bold text-slate-700 mb-1">No. HP / WhatsApp</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 rounded-xl border font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Termin Pembayaran (Hari)</label>
                <input
                  type="number"
                  value={formData.paymentTermsDays}
                  onChange={(e) => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Limit Kredit Piutang (Rp)</label>
              <input
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                className="w-full p-2 rounded-xl border font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap</label>
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
                Simpan Pelanggan
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deletingCustomer && (
        <ConfirmDialog
          isOpen={!!deletingCustomer}
          onClose={() => setDeletingCustomer(null)}
          onConfirm={handleDeleteCustomer}
          title="Hapus Pelanggan"
          message={`Apakah Anda yakin ingin menghapus pelanggan ${deletingCustomer.name} (${deletingCustomer.code}) secara permanen? Data pelanggan akan dihapus dari database.`}
          isDangerous={true}
        />
      )}
    </div>
  );
}
