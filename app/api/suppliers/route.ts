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
        { contactPerson: { contains: search } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(suppliers);
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
      contactPerson = '',
      phone,
      address,
      notes = '',
      userName = 'Admin',
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Nama supplier dan nomor HP wajib diisi' }, { status: 400 });
    }

    let supCode = code;
    if (!supCode) {
      const count = await prisma.supplier.count();
      supCode = `SUP-${String(count + 1).padStart(4, '0')}`;
    }

    const supplier = await prisma.supplier.create({
      data: {
        code: supCode,
        name,
        contactPerson: contactPerson || name,
        phone,
        address: address || '-',
        notes,
      },
    });

    await recordAuditLog(userName, 'SUPPLIER_UPDATE', `Menambah supplier baru: ${supplier.name} (${supplier.code})`);

    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
