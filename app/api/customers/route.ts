import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const where: any = { status: 'ACTIVE' };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      name,
      phone,
      address,
      customerType = 'RETAIL',
      creditLimit = 0,
      paymentTermsDays = 0,
      notes = '',
      userName = 'Admin',
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Nama dan nomor HP wajib diisi' }, { status: 400 });
    }

    // Auto generate code if missing
    let custCode = code;
    if (!custCode) {
      const count = await prisma.customer.count();
      custCode = `PLG-${String(count + 1).padStart(4, '0')}`;
    }

    const customer = await prisma.customer.create({
      data: {
        code: custCode,
        name,
        phone,
        address: address || '-',
        customerType,
        creditLimit: Number(creditLimit),
        paymentTermsDays: Number(paymentTermsDays),
        notes,
      },
    });

    await recordAuditLog(userName, 'CUSTOMER_UPDATE', `Menambah pelanggan baru: ${customer.name} (${customer.code})`);

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
