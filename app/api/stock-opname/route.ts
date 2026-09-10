import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adjustProductStock } from '@/lib/stock';
import { recordAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const opnames = await prisma.stockOpname.findMany({
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(opnames);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { items = [], notes = '', createdBy = 'Gudang' } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Tidak ada item yang disesuaikan' }, { status: 400 });
    }

    const today = new Date();
    const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.stockOpname.count();
    const opnameNo = `OPN-${yyyymmdd}-${String(count + 1).padStart(3, '0')}`;

    const opname = await prisma.stockOpname.create({
      data: {
        opnameNo,
        createdBy,
        notes,
        status: 'PROCESSED',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            systemStock: Number(item.systemStock),
            physicalStock: Number(item.physicalStock),
            difference: Number(item.physicalStock) - Number(item.systemStock),
            notes: item.notes || null,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    // Process stock adjustments & movements for each difference
    for (const item of items) {
      const diff = Number(item.physicalStock) - Number(item.systemStock);
      if (diff !== 0) {
        await adjustProductStock({
          productId: item.productId,
          type: 'STOCK_ADJUSTMENT',
          refNo: opnameNo,
          qtyChange: diff, // positive if physical > system, negative if physical < system
          userName: createdBy,
          notes: `Hasil Stock Opname ${opnameNo}. Selisih: ${diff > 0 ? '+' : ''}${diff}. Catatan: ${item.notes || '-'}`,
        });
      }
    }

    await recordAuditLog(
      createdBy,
      'STOCK_ADJUSTMENT',
      `Memproses Stock Opname ${opnameNo} untuk ${items.length} produk.`
    );

    return NextResponse.json(opname, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
