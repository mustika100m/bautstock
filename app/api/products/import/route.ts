import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateProductImport, ImportedRow } from '@/lib/excel';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { rows, action, userName = 'Admin' } = await req.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang dikirim' }, { status: 400 });
    }

    const existingProducts = await prisma.product.findMany({ select: { sku: true } });
    const existingSkus = new Set(existingProducts.map((p) => p.sku));

    const validation = validateProductImport(rows, existingSkus);

    // If action is "validate", only return validation result
    if (action === 'validate') {
      return NextResponse.json(validation);
    }

    // If action is "commit", insert all valid rows
    if (action === 'commit') {
      const validRows = validation.validRows;
      let insertedCount = 0;

      for (const item of validRows) {
        const prod = await prisma.product.create({
          data: {
            sku: item.sku,
            name: item.name,
            category: item.category,
            itemType: item.itemType,
            metric: item.metric,
            length: item.length,
            material: item.material,
            grade: item.grade,
            finishing: item.finishing,
            unit: item.unit,
            stock: item.stock,
            buyPrice: item.buyPrice,
            cashPrice: item.cashPrice,
            tempoPrice: item.tempoPrice,
            retailPrice: item.retailPrice,
            wholesalePrice: item.wholesalePrice,
            warehouse: item.warehouse || 'Gudang Utama',
            rackLocation: item.rackLocation || 'Rak A',
            boxBin: item.boxBin || 'A-01',
          },
        });

        if (prod.stock > 0) {
          await prisma.stockMovement.create({
            data: {
              productId: prod.id,
              type: 'INITIAL_STOCK',
              refNo: `IMPORT-${prod.sku}`,
              qtyIn: prod.stock,
              qtyOut: 0,
              stockBefore: 0,
              stockAfter: prod.stock,
              userName,
              notes: 'Import Excel stok awal',
            },
          });
        }
        insertedCount++;
      }

      await recordAuditLog(
        userName,
        'ADD_PRODUCT',
        `Import Excel berhasil memasukkan ${insertedCount} produk baru`
      );

      return NextResponse.json({ success: true, count: insertedCount });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
