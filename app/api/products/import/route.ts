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

    const existingProducts = await prisma.product.findMany({
      select: {
        sku: true,
        category: true,
        itemType: true,
        metric: true,
        length: true,
        material: true,
        grade: true,
        finishing: true,
      },
    });
    const existingSkus = new Set(existingProducts.map((p) => p.sku));
    const existingSpecs = new Set(
      existingProducts.map((p) =>
        `${p.category}|${p.itemType}|${p.metric}|${p.length}|${p.material}|${p.grade}|${p.finishing}`.toLowerCase()
      )
    );

    const validation = validateProductImport(rows, existingSkus, existingSpecs);

    // If action is "validate", only return validation result
    if (action === 'validate') {
      return NextResponse.json(validation);
    }

    // If action is "commit", insert or update all valid rows
    if (action === 'commit') {
      const validRows = validation.validRows;
      let insertedCount = 0;

      for (const item of validRows) {
        try {
          const prod = await prisma.product.upsert({
            where: {
              unique_product_spec: {
                category: item.category,
                itemType: item.itemType,
                metric: item.metric,
                length: item.length,
                material: item.material,
                grade: item.grade,
                finishing: item.finishing,
              },
            },
            update: {
              stock: { increment: item.stock },
              buyPrice: item.buyPrice > 0 ? item.buyPrice : undefined,
              retailPrice: item.retailPrice > 0 ? item.retailPrice : undefined,
              wholesalePrice: item.wholesalePrice > 0 ? item.wholesalePrice : undefined,
            },
            create: {
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

          if (item.stock > 0) {
            await prisma.stockMovement.create({
              data: {
                productId: prod.id,
                type: 'INITIAL_STOCK',
                refNo: `IMPORT-${prod.sku}`,
                qtyIn: item.stock,
                qtyOut: 0,
                stockBefore: prod.stock - item.stock > 0 ? prod.stock - item.stock : 0,
                stockAfter: prod.stock,
                userName,
                notes: 'Import Excel stok awal',
              },
            });
          }
          insertedCount++;
        } catch (err: any) {
          console.error('Error importing item:', item.sku, err);
        }
      }

      await recordAuditLog(
        userName,
        'ADD_PRODUCT',
        `Import Excel berhasil memproses ${insertedCount} produk`
      );

      return NextResponse.json({ success: true, count: insertedCount });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
