import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { code, name, contactPerson, phone, address, notes, userName = 'Admin' } = body;

    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 });
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name: name || existing.name,
        contactPerson: contactPerson || existing.contactPerson,
        phone: phone || existing.phone,
        address: address !== undefined ? address : existing.address,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    await recordAuditLog(userName, 'SUPPLIER_UPDATE', `Mengubah data supplier: ${updated.name} (${updated.code})`);

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 });
    }

    // Hard delete supplier
    await prisma.supplier.delete({
      where: { id },
    });

    await recordAuditLog('Admin', 'SUPPLIER_UPDATE', `Menghapus data supplier ${supplier.name} (${supplier.code})`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
