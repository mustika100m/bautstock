import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adjustProductStock } from '@/lib/stock';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { reason = 'Pembatalan pembelian', userName = 'Admin' } = await req.json();

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { items: true, payable: true },
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Transaksi pembelian tidak ditemukan' }, { status: 404 });
    }

    if (purchase.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Pembelian sudah dibatalkan sebelumnya' }, { status: 400 });
    }

    await prisma.purchase.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason: reason,
      },
    });

    // Reduce stock for purchase cancellation
    for (const item of purchase.items) {
      await adjustProductStock({
        productId: item.productId,
        type: 'RETURN_OUT',
        refNo: `CANCEL-${purchase.invoiceNo}`,
        qtyChange: -item.qty, // subtract stock
        userName,
        notes: `Pembatalan pembelian ${purchase.invoiceNo}: ${reason}`,
      });
    }

    if (purchase.payable) {
      await prisma.payable.delete({
        where: { id: purchase.payable.id },
      });
    }

    await recordAuditLog(
      userName,
      'CANCEL_TRANSACTION',
      `Membatalkan pembelian ${purchase.invoiceNo}. Alasan: ${reason}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
