import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { receivableId, amount, paymentMethod = 'CASH', notes = '', userName = 'Kasir' } = await req.json();

    if (!receivableId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Jumlah pembayaran tidak valid' }, { status: 400 });
    }

    const rec = await prisma.receivable.findUnique({
      where: { id: receivableId },
      include: { sale: true, customer: true },
    });

    if (!rec) {
      return NextResponse.json({ error: 'Data piutang tidak ditemukan' }, { status: 404 });
    }

    const payVal = Number(amount);
    const newPaidAmount = rec.paidAmount + payVal;
    const newRemaining = Math.max(0, rec.totalAmount - newPaidAmount);
    const newStatus = newRemaining === 0 ? 'PAID' : 'PARTIAL';

    const [payment, updatedRec] = await prisma.$transaction([
      prisma.receivablePayment.create({
        data: {
          receivableId,
          amount: payVal,
          paymentMethod,
          notes,
        },
      }),
      prisma.receivable.update({
        where: { id: receivableId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemaining,
          status: newStatus,
        },
      }),
      prisma.sale.update({
        where: { id: rec.saleId },
        data: {
          paidAmount: rec.sale.paidAmount + payVal,
          paymentStatus: newStatus,
        },
      }),
    ]);

    await recordAuditLog(
      userName,
      'SALE_TRANSACTION',
      `Mencatat pembayaran piutang ${rec.customer.name} (Invoice: ${rec.sale.invoiceNo}) sebesar Rp ${payVal.toLocaleString('id-ID')}`
    );

    return NextResponse.json(updatedRec);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
