import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { ids, action, userName = 'Admin' } = await req.json();

    if (action === 'reset_all') {
      const activeProducts = await prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, sku: true },
      });

      const now = Date.now();
      for (let i = 0; i < activeProducts.length; i++) {
        const prod = activeProducts[i];
        const freeSku = prod.sku.includes('_INACTIVE_') ? prod.sku : `${prod.sku}_INACTIVE_${now}_${i}`;
        await prisma.product.update({
          where: { id: prod.id },
          data: { status: 'INACTIVE', sku: freeSku },
        });
      }

      await recordAuditLog(
        userName,
        'EDIT_PRODUCT',
        `Mereset katalog: Menonaktifkan ${activeProducts.length} produk aktif dan membebaskan SKU.`
      );

      return NextResponse.json({ success: true, count: activeProducts.length });
    }

    if (action === 'delete_selected' || Array.isArray(ids)) {
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'Tidak ada produk yang dipilih' }, { status: 400 });
      }

      const productsToDelete = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, sku: true, name: true },
      });

      const now = Date.now();
      for (let i = 0; i < productsToDelete.length; i++) {
        const prod = productsToDelete[i];
        const freeSku = prod.sku.includes('_INACTIVE_') ? prod.sku : `${prod.sku}_INACTIVE_${now}_${i}`;
        await prisma.product.update({
          where: { id: prod.id },
          data: { status: 'INACTIVE', sku: freeSku },
        });
      }

      await recordAuditLog(
        userName,
        'EDIT_PRODUCT',
        `Menonaktifkan secara massal ${productsToDelete.length} produk.`
      );

      return NextResponse.json({ success: true, count: productsToDelete.length });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghapus produk massal' }, { status: 500 });
  }
}
