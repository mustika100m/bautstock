import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { payableId, amount, paymentMethod = 'TRANSFER', notes = '', userName = 'Admin' } = await req.json();

    if (!payableId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Jumlah pembayaran tidak valid' }, { status: 400 });
    }

    const pay = await prisma.payable.findUnique({
      where: { id: payableId },
      include: { purchase: true, supplier: true },
    });

    if (!pay) {
      return NextResponse.json({ error: 'Data hutang tidak ditemukan' }, { status: 404 });
    }

    const payVal = Number(amount);
    const newPaidAmount = pay.paidAmount + payVal;
    const newRemaining = Math.max(0, pay.totalAmount - newPaidAmount);
    const newStatus = newRemaining === 0 ? 'PAID' : 'PARTIAL';

    const [payment, updatedPay] = await prisma.$transaction([
      prisma.payablePayment.create({
        data: {
          payableId,
          amount: payVal,
          paymentMethod,
          notes,
        },
      }),
      prisma.payable.update({
        where: { id: payableId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemaining,
          status: newStatus,
        },
      }),
    ]);

    await recordAuditLog(
      userName,
      'PURCHASE_TRANSACTION',
      `Mencatat pembayaran hutang ke ${pay.supplier.name} (Invoice: ${pay.purchase.invoiceNo}) sebesar Rp ${payVal.toLocaleString('id-ID')}`
    );

    return NextResponse.json(updatedPay);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
