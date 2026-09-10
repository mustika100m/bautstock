'use client';

import React, { useState, useEffect } from 'react';
import { History, Search, Shield, User } from 'lucide-react';
import { formatTanggal } from '@/lib/formatters';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/audit-log?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-sky-600" />
          <span>Audit Log Activity System</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Catatan jejak aktivitas penting user (perubahan harga, transaksi, pembatalan, & stock adjustment).
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Cari user, aktivitas (PRICE_CHANGE, CANCEL_TRANSACTION...), atau detail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-xs font-semibold focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600 font-bold mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800">{log.userName}</span>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-slate-100 text-slate-700 border">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium mt-1">{log.details}</p>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 shrink-0">
                {formatTanggal(log.timestamp)}
              </span>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              Belum ada log aktivitas tercatat
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
