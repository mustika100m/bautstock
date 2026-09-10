'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = totalItems && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null;
  const endItem =
    totalItems && itemsPerPage ? Math.min(currentPage * itemsPerPage, totalItems) : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-sm text-slate-500">
      {totalItems && startItem && endItem ? (
        <div>
          Menampilkan <span className="font-semibold text-slate-700">{startItem}</span> -{' '}
          <span className="font-semibold text-slate-700">{endItem}</span> dari{' '}
          <span className="font-semibold text-slate-700">{totalItems}</span> data
        </div>
      ) : (
        <div>
          Halaman <span className="font-semibold text-slate-700">{currentPage}</span> dari{' '}
          <span className="font-semibold text-slate-700">{totalPages}</span>
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Sebelumnya</span>
        </button>

        <div className="flex items-center gap-1 px-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === totalPages ||
                Math.abs(p - currentPage) <= 1
            )
            .map((page, idx, arr) => {
              const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
              return (
                <React.Fragment key={page}>
                  {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                  <button
                    onClick={() => onPageChange(page)}
                    className={`w-8 h-8 rounded-lg font-medium text-xs transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent font-medium transition-colors"
        >
          <span>Selanjutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
