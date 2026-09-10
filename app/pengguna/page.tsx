'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Edit, Trash2, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function PenggunaPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    role: 'KASIR',
    active: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('bautstock_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {}
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const isOwner = currentUser?.role === 'OWNER';

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setShowPassword(false);
    setFormData({
      username: '',
      name: '',
      password: '',
      role: 'KASIR',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: any) => {
    setEditingUser(u);
    setShowPassword(false);
    setFormData({
      username: u.username,
      name: u.name,
      password: u.password || '123',
      role: u.role,
      active: u.active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      showToast('Hanya role OWNER yang dapat mengelola pengguna!', 'error');
      return;
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, adminUserName: currentUser?.name || 'Owner' }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan data pengguna');
      }

      showToast(
        editingUser
          ? `Pengguna ${formData.name} berhasil diperbarui!`
          : `Pengguna ${formData.name} berhasil ditambahkan!`,
        'success'
      );
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus pengguna');
      showToast(`Akun pengguna ${deletingUser.name} telah berhasil dihapus!`, 'success');
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-sky-600" />
            <span>Manajemen Pengguna & Hak Akses</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pengelolaan & penetapan role pengguna (OWNER, ADMIN, KASIR, GUDANG). Khusus Role Owner.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all shadow-md shadow-sky-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        )}
      </div>

      {!isOwner && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-xs text-amber-800">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Anda saat ini login sebagai <strong>{currentUser?.role}</strong>. Hanya pengguna dengan role <strong>OWNER</strong> yang dapat menambah, mengedit, atau menghapus pengguna.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {users.map((u) => (
          <div key={u.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-sky-700 font-mono">@{u.username}</span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded border ${
                    u.role === 'OWNER'
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : u.role === 'ADMIN'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : u.role === 'KASIR'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {u.role}
                </span>
              </div>
              <h3 className="font-extrabold text-base text-slate-800 mt-2">{u.name}</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Status:{' '}
                <span className={`font-bold ${u.active ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {u.active ? 'Aktif' : 'Nonaktif'}
                </span>
              </p>
            </div>

            {isOwner && (
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-xs">
                <button
                  onClick={() => handleOpenEditModal(u)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit User & Password
                </button>
                <button
                  onClick={() => setDeletingUser(u)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                  title="Hapus User"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingUser ? `Edit Pengguna: @${editingUser.username}` : 'Tambah Pengguna Baru'}
        >
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Username Login</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full p-2.5 rounded-xl border font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap User</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2.5 pr-10 rounded-xl border font-semibold"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 p-1 font-bold text-xs"
                  title={showPassword ? 'Sembunyikan Password' : 'Lihat Password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tetapkan Role Pengguna</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-2.5 rounded-xl border font-extrabold text-slate-800"
              >
                <option value="OWNER">OWNER (Akses Penuh Seluruh Sistem)</option>
                <option value="ADMIN">ADMIN (Manajer Pembelian & Penjualan)</option>
                <option value="KASIR">KASIR (Penjualan POS & Cek Stok)</option>
                <option value="GUDANG">GUDANG (Kelola Stok & Opname)</option>
              </select>
            </div>

            {editingUser && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Akun</label>
                <select
                  value={formData.active ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                  className="w-full p-2.5 rounded-xl border font-bold"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </div>
            )}

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
                Simpan Data Pengguna
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deletingUser && (
        <ConfirmDialog
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={handleDeleteUser}
          title="Hapus Pengguna"
          message={`Apakah Anda yakin ingin menghapus akun pengguna @${deletingUser.username} (${deletingUser.name}) secara permanen? Pengguna akan hilang dari daftar.`}
          isDangerous={true}
        />
      )}
    </div>
  );
}
