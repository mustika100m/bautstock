import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { code, name, phone, address, customerType, creditLimit, paymentTermsDays, notes, userName = 'Admin' } = body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: name || existing.name,
        phone: phone || existing.phone,
        address: address !== undefined ? address : existing.address,
        customerType: customerType || existing.customerType,
        creditLimit: creditLimit !== undefined ? Number(creditLimit) : existing.creditLimit,
        paymentTermsDays: paymentTermsDays !== undefined ? Number(paymentTermsDays) : existing.paymentTermsDays,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    await recordAuditLog(userName, 'CUSTOMER_UPDATE', `Mengubah data pelanggan: ${updated.name} (${updated.code})`);

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 });
    }

    // Unlink customerId from existing sales
    await prisma.sale.updateMany({
      where: { customerId: id },
      data: { customerId: null },
    });

    // Hard delete customer
    await prisma.customer.delete({
      where: { id },
    });

    await recordAuditLog('Admin', 'CUSTOMER_UPDATE', `Menghapus data pelanggan ${customer.name} (${customer.code})`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
