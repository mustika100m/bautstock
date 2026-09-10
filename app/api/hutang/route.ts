import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { supplier: { name: { contains: search } } },
        { purchase: { invoiceNo: { contains: search } } },
        { purchase: { supplierInvoiceNo: { contains: search } } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const payables = await prisma.payable.findMany({
      where,
      include: {
        supplier: true,
        purchase: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json(payables);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
