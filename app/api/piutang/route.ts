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
        { customer: { name: { contains: search } } },
        { sale: { invoiceNo: { contains: search } } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const receivables = await prisma.receivable.findMany({
      where,
      include: {
        customer: true,
        sale: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json(receivables);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
