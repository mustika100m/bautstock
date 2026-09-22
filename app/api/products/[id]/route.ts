import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { id } = params;
    const { userName = 'Admin', thread, materialGrade, sku, ...updateData } = body;

    const currentProduct = await prisma.product.findUnique({ where: { id } });
    if (!currentProduct) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    let finalSku = currentProduct.sku;
    if (sku && typeof sku === 'string' && sku.trim() !== '') {
      const trimmedSku = sku.trim();
      if (trimmedSku !== currentProduct.sku) {
        let candidateSku = trimmedSku;
        let counter = 1;
        while (
          await prisma.product.findFirst({
            where: {
              sku: candidateSku,
              id: { not: id },
            },
          })
        ) {
          counter++;
          candidateSku = `${trimmedSku}-${counter}`;
        }
        finalSku = candidateSku;
      } else {
        finalSku = currentProduct.sku;
      }
    }

    if (thread !== undefined) {
      updateData.metric = thread;
    }

    if (materialGrade !== undefined) {
      const gradeMatch = materialGrade.match(/(12\.9|10\.9|8\.8|4\.8|316|304|A4-80|A2-70|Class 10|Class 8)/i);
      if (gradeMatch) {
        updateData.grade = gradeMatch[1].toUpperCase();
        updateData.material = materialGrade.replace(gradeMatch[0], '').replace(/[()]/g, '').trim() || 'Baja Karbon';
      } else {
        updateData.material = materialGrade;
        updateData.grade = '-';
      }
    }

    // Check price changes
    const priceChanged =
      updateData.buyPrice !== undefined && updateData.buyPrice !== currentProduct.buyPrice ||
      updateData.cashPrice !== undefined && updateData.cashPrice !== currentProduct.cashPrice ||
      updateData.tempoPrice !== undefined && updateData.tempoPrice !== currentProduct.tempoPrice ||
      updateData.retailPrice !== undefined && updateData.retailPrice !== currentProduct.retailPrice ||
      updateData.wholesalePrice !== undefined && updateData.wholesalePrice !== currentProduct.wholesalePrice;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        sku: finalSku,
        stock: updateData.stock !== undefined ? Number(updateData.stock) : currentProduct.stock,
        minStock: updateData.minStock !== undefined ? Number(updateData.minStock) : currentProduct.minStock,
        buyPrice: updateData.buyPrice !== undefined ? Number(updateData.buyPrice) : currentProduct.buyPrice,
        cashPrice: updateData.cashPrice !== undefined ? Number(updateData.cashPrice) : currentProduct.cashPrice,
        tempoPrice: updateData.tempoPrice !== undefined ? Number(updateData.tempoPrice) : currentProduct.tempoPrice,
        retailPrice: updateData.retailPrice !== undefined ? Number(updateData.retailPrice) : currentProduct.retailPrice,
        wholesalePrice: updateData.wholesalePrice !== undefined ? Number(updateData.wholesalePrice) : currentProduct.wholesalePrice,
      },
    });

    if (priceChanged) {
      await recordAuditLog(
        userName,
        'PRICE_CHANGE',
        `Perubahan harga pada ${product.name} (SKU: ${product.sku}). Cash: Rp ${product.cashPrice}, Tempo: Rp ${product.tempoPrice}, Retail: Rp ${product.retailPrice}, Grosir: Rp ${product.wholesalePrice}`
      );
    } else {
      await recordAuditLog(userName, 'EDIT_PRODUCT', `Mengedit data produk: ${product.name} (SKU: ${product.sku})`);
    }

    return NextResponse.json(product);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'SKU atau barcode tersebut sudah digunakan oleh produk lain' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Gagal mengedit produk' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    // Soft delete by marking INACTIVE
    await prisma.product.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    await recordAuditLog('Admin', 'EDIT_PRODUCT', `Menonaktifkan produk: ${product.name} (SKU: ${product.sku})`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
