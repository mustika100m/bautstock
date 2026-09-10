import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        items: { include: { product: true } },
        payable: true,
      },
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Transaksi pembelian tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(purchase);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      supplierInvoiceNo,
      notes,
      userName = 'Admin',
    } = body;

    const existingPurchase = await prisma.purchase.findUnique({
      where: { id: params.id },
    });

    if (!existingPurchase) {
      return NextResponse.json({ error: 'Transaksi pembelian tidak ditemukan' }, { status: 404 });
    }

    const updatedPurchase = await prisma.purchase.update({
      where: { id: params.id },
      data: {
        supplierInvoiceNo: supplierInvoiceNo ?? existingPurchase.supplierInvoiceNo,
        notes: notes ?? existingPurchase.notes,
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    await recordAuditLog(
      userName,
      'PURCHASE_UPDATE',
      `Mengubah data pembelian invoice ${updatedPurchase.invoiceNo}`
    );

    return NextResponse.json(updatedPurchase);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        items: true,
        payable: { include: { payments: true } },
      },
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Transaksi pembelian tidak ditemukan' }, { status: 404 });
    }

    // Revert stock if purchase was COMPLETED (subtract stock added by purchase)
    if (purchase.status === 'COMPLETED') {
      for (const item of purchase.items) {
        const prod = await prisma.product.findUnique({ where: { id: item.productId } });
        if (prod) {
          const newStock = Math.max(0, prod.stock - item.qty);
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: newStock },
          });

          await prisma.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'STOCK_ADJUSTMENT',
              refNo: `DEL-${purchase.invoiceNo}`,
              qtyIn: 0,
              qtyOut: item.qty,
              stockBefore: prod.stock,
              stockAfter: newStock,
              notes: `Penghapusan Pembelian #${purchase.invoiceNo}`,
            },
          });
        }
      }
    }

    // Delete associated payable & payments if exists
    if (purchase.payable) {
      await prisma.payablePayment.deleteMany({
        where: { payableId: purchase.payable.id },
      });
      await prisma.payable.delete({
        where: { id: purchase.payable.id },
      });
    }

    // Delete purchase items & purchase record
    await prisma.purchaseItem.deleteMany({
      where: { purchaseId: id },
    });

    await prisma.purchase.delete({
      where: { id },
    });

    await recordAuditLog('Admin', 'CANCEL_TRANSACTION', `Menghapus permanen transaksi pembelian ${purchase.invoiceNo}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
