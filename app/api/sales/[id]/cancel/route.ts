import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adjustProductStock } from '@/lib/stock';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { reason = 'Pembatalan transaksi oleh user', userName = 'Admin' } = await req.json();

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true, receivable: true },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    if (sale.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Transaksi sudah dibatalkan sebelumnya' }, { status: 400 });
    }

    // Mark sale CANCELLED
    await prisma.sale.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason: reason,
      },
    });

    // Restore stock for all items
    for (const item of sale.items) {
      await adjustProductStock({
        productId: item.productId,
        type: 'RETURN_IN',
        refNo: `CANCEL-${sale.invoiceNo}`,
        qtyChange: item.qty, // add back stock
        userName,
        notes: `Pengembalian stok dari pembatalan transaksi ${sale.invoiceNo}: ${reason}`,
      });
    }

    // If there was a receivable, mark it status CANCELLED or delete
    if (sale.receivable) {
      await prisma.receivable.delete({
        where: { id: sale.receivable.id },
      });
    }

    await recordAuditLog(
      userName,
      'CANCEL_TRANSACTION',
      `Membatalkan penjualan ${sale.invoiceNo}. Alasan: ${reason}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
