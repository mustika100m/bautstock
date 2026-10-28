import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateProductImport } from '@/lib/excel';
import { recordAuditLog } from '@/lib/audit';
import { generateAutoSku } from '@/lib/sku';

function getVal(row: any, ...keys: string[]): string {
  if (!row || typeof row !== 'object') return '';
  const normMap: { [k: string]: any } = {};
  for (const k of Object.keys(row)) {
    const cleanKey = k.replace(/[\r\n\t]/g, '').trim().toLowerCase();
    normMap[cleanKey] = row[k];
  }
  for (const key of keys) {
    const cleanTarget = key.replace(/[\r\n\t]/g, '').trim().toLowerCase();
    if (normMap[cleanTarget] !== undefined && normMap[cleanTarget] !== null && String(normMap[cleanTarget]).trim() !== '') {
      return String(normMap[cleanTarget]).trim();
    }
  }
  return '';
}

export async function POST(req: NextRequest) {
  try {
    const { rows, action, userName = 'Admin', updateExisting = false } = await req.json();

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
        status: true,
      },
    });

    const activeProducts = existingProducts.filter((p) => p.status === 'ACTIVE');
    const inactiveProducts = existingProducts.filter((p) => p.status === 'INACTIVE');

    const activeSkus = new Set(activeProducts.map((p) => p.sku));
    const activeSpecs = new Set(
      activeProducts.map((p) =>
        `${p.category}|${p.itemType}|${p.metric}|${p.length}|${p.material}|${p.grade}|${p.finishing}`.toLowerCase()
      )
    );

    const inactiveSkus = new Set(inactiveProducts.map((p) => p.sku));
    const inactiveSpecs = new Set(
      inactiveProducts.map((p) =>
        `${p.category}|${p.itemType}|${p.metric}|${p.length}|${p.material}|${p.grade}|${p.finishing}`.toLowerCase()
      )
    );

    const existingSkus = new Set(existingProducts.map((p) => p.sku));
    const existingSpecs = new Set(
      existingProducts.map((p) =>
        `${p.category}|${p.itemType}|${p.metric}|${p.length}|${p.material}|${p.grade}|${p.finishing}`.toLowerCase()
      )
    );

    const validation = validateProductImport(
      rows,
      existingSkus,
      existingSpecs,
      activeSkus,
      activeSpecs,
      inactiveSkus,
      inactiveSpecs,
      updateExisting
    );

    // If action is "validate", return validation result
    if (action === 'validate') {
      return NextResponse.json(validation);
    }

    // If action is "commit", insert or update all rows
    if (action === 'commit') {
      let insertedCount = 0;

      for (const row of rows) {
        let sku = getVal(row, 'SKU', 'sku', 'Kode Barang');
        const materialGrade = getVal(row, 'Material/Grade', 'Material / Grade', 'Material', 'materialGrade', 'material');
        const thread = getVal(row, 'Thread', 'Metric', 'thread', 'metric');
        const itemType = getVal(row, 'Jenis Barang', 'Jenis', 'itemType');
        const length = getVal(row, 'Panjang', 'length');
        const finishing = getVal(row, 'Finishing', 'finishing');
        const unit = getVal(row, 'Satuan', 'unit') || 'Pcs';
        const stock = Number(getVal(row, 'Stok', 'stock') || 0);
        const minStock = Number(getVal(row, 'Stok Min', 'Min Stock', 'minStock') || 10);
        const buyPrice = Number(getVal(row, 'Harga Beli', 'Harga Beli (Modal)', 'buyPrice') || 0);
        const retailPrice = Number(getVal(row, 'Harga Retail', 'retailPrice') || 0);
        const wholesalePrice = Number(getVal(row, 'Harga Grosir', 'wholesalePrice') || 0);
        const gudang = getVal(row, 'Gudang', 'warehouse') || 'Gudang Utama';
        const lokasi = getVal(row, 'Lokasi', 'location', 'Rak', 'Lokasi Rak') || 'Rak A';
        const boxBin = getVal(row, 'Box Bin', 'Box/Bin', 'boxBin') || 'A-01';
        const barcode = getVal(row, 'Barcode', 'barcode') || null;

        let category = getVal(row, 'Kategori', 'category');
        if (!category && itemType) {
          category = itemType.trim().split(/\s+/)[0] || 'Baut';
        }
        if (!category) category = 'Baut';

        if (!itemType && !materialGrade) continue;

        const rawItemType = itemType || '';
        const finalMetric = thread || '';
        const finalLength = length || '';
        const finalMaterial = materialGrade || '';
        const finalFinishing = finishing || '';

        const baseSku = generateAutoSku({
          category,
          itemType: rawItemType,
          thread: finalMetric,
          length: finalLength,
          materialGrade: finalMaterial,
          finishing: finalFinishing,
        });

        let isOldAutoSku = false;
        if (sku) {
          if (!thread && /-FT-/i.test(sku)) isOldAutoSku = true;
          if (!finishing && /-HTM$/i.test(sku)) isOldAutoSku = true;
          if (!length && /-8MM-/i.test(sku)) isOldAutoSku = true;
          if (!materialGrade && /^GR4\.6-/i.test(sku)) isOldAutoSku = true;
        }

        const finalSku = (!sku || isOldAutoSku) ? baseSku : sku;
        const autoName = [finalMaterial, finalMetric, rawItemType, finalLength, finalFinishing]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        try {
          let prod;
          if (updateExisting) {
            // Find existing product by SKU first, or by Spec
            const existingBySku = await prisma.product.findUnique({
              where: { sku: finalSku },
            });

            const existingBySpec = !existingBySku
              ? await prisma.product.findUnique({
                  where: {
                    unique_product_spec: {
                      category,
                      itemType: rawItemType,
                      metric: finalMetric,
                      length: finalLength,
                      material: finalMaterial,
                      grade: '-',
                      finishing: finalFinishing,
                    },
                  },
                })
              : null;

            const existingProd = existingBySku || existingBySpec;

            if (existingProd) {
              const oldStock = existingProd.stock;
              const newStock = stock;

              prod = await prisma.product.update({
                where: { id: existingProd.id },
                data: {
                  status: 'ACTIVE',
                  sku: finalSku,
                  name: autoName,
                  unit,
                  warehouse: gudang,
                  rackLocation: lokasi,
                  boxBin: boxBin,
                  minStock: minStock > 0 ? minStock : existingProd.minStock,
                  barcode: barcode || existingProd.barcode,
                  stock: newStock,
                  buyPrice: buyPrice > 0 ? buyPrice : existingProd.buyPrice,
                  cashPrice: retailPrice > 0 ? retailPrice : existingProd.cashPrice,
                  tempoPrice: wholesalePrice > 0 ? wholesalePrice : existingProd.tempoPrice,
                  retailPrice: retailPrice > 0 ? retailPrice : existingProd.retailPrice,
                  wholesalePrice: wholesalePrice > 0 ? wholesalePrice : existingProd.wholesalePrice,
                },
              });

              if (newStock !== oldStock) {
                const diff = newStock - oldStock;
                await prisma.stockMovement.create({
                  data: {
                    productId: prod.id,
                    type: 'STOCK_ADJUSTMENT',
                    refNo: `IMPORT-UPDATE-${prod.sku}`,
                    qtyIn: diff > 0 ? diff : 0,
                    qtyOut: diff < 0 ? Math.abs(diff) : 0,
                    stockBefore: oldStock,
                    stockAfter: newStock,
                    userName,
                    notes: 'Penyesuaian stok via Import Excel (Timpa)',
                  },
                });
              }
            } else {
              prod = await prisma.product.create({
                data: {
                  sku: finalSku,
                  name: autoName,
                  category,
                  itemType: rawItemType,
                  metric: finalMetric,
                  length: finalLength,
                  material: finalMaterial,
                  grade: '-',
                  finishing: finalFinishing,
                  unit,
                  stock,
                  minStock,
                  buyPrice,
                  cashPrice: retailPrice,
                  tempoPrice: wholesalePrice,
                  retailPrice,
                  wholesalePrice,
                  warehouse: gudang,
                  rackLocation: lokasi,
                  boxBin: boxBin,
                  barcode,
                },
              });

              if (stock > 0) {
                await prisma.stockMovement.create({
                  data: {
                    productId: prod.id,
                    type: 'INITIAL_STOCK',
                    refNo: `IMPORT-${prod.sku}`,
                    qtyIn: stock,
                    qtyOut: 0,
                    stockBefore: 0,
                    stockAfter: stock,
                    userName,
                    notes: 'Import Excel stok awal',
                  },
                });
              }
            }
          } else {
            prod = await prisma.product.upsert({
              where: {
                unique_product_spec: {
                  category,
                  itemType: rawItemType,
                  metric: finalMetric,
                  length: finalLength,
                  material: finalMaterial,
                  grade: '-',
                  finishing: finalFinishing,
                },
              },
              update: {
                status: 'ACTIVE',
                sku: finalSku,
                name: autoName,
                unit,
                warehouse: gudang,
                rackLocation: lokasi,
                boxBin: boxBin,
                minStock: minStock > 0 ? minStock : undefined,
                barcode: barcode || undefined,
                stock: stock > 0 ? { increment: stock } : undefined,
                buyPrice: buyPrice > 0 ? buyPrice : undefined,
                cashPrice: retailPrice > 0 ? retailPrice : undefined,
                tempoPrice: wholesalePrice > 0 ? wholesalePrice : undefined,
                retailPrice: retailPrice > 0 ? retailPrice : undefined,
                wholesalePrice: wholesalePrice > 0 ? wholesalePrice : undefined,
              },
              create: {
                sku: finalSku,
                name: autoName,
                category,
                itemType: rawItemType,
                metric: finalMetric,
                length: finalLength,
                material: finalMaterial,
                grade: '-',
                finishing: finalFinishing,
                unit,
                stock,
                minStock,
                buyPrice,
                cashPrice: retailPrice,
                tempoPrice: wholesalePrice,
                retailPrice,
                wholesalePrice,
                warehouse: gudang,
                rackLocation: lokasi,
                boxBin: boxBin,
                barcode,
              },
            });

            if (stock > 0) {
              await prisma.stockMovement.create({
                data: {
                  productId: prod.id,
                  type: 'INITIAL_STOCK',
                  refNo: `IMPORT-${prod.sku}`,
                  qtyIn: stock,
                  qtyOut: 0,
                  stockBefore: prod.stock - stock > 0 ? prod.stock - stock : 0,
                  stockAfter: prod.stock,
                  userName,
                  notes: 'Import Excel stok awal',
                },
              });
            }
          }

          insertedCount++;
        } catch (err: any) {
          console.error('Error importing item:', finalSku, err);
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
