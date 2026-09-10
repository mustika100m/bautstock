import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: { include: { product: true } },
        receivable: true,
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Transaksi penjualan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(sale);
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
      customerName,
      priceType,
      paymentMethod,
      discount,
      notes,
      userName = 'Admin',
    } = body;

    const existingSale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!existingSale) {
      return NextResponse.json({ error: 'Transaksi penjualan tidak ditemukan' }, { status: 404 });
    }

    const newDiscount = discount !== undefined ? Number(discount) : existingSale.discount;
    const newGrandTotal = Math.max(0, existingSale.totalAmount - newDiscount);

    const updatedSale = await prisma.sale.update({
      where: { id: params.id },
      data: {
        customerName: customerName ?? existingSale.customerName,
        priceType: priceType ?? existingSale.priceType,
        paymentMethod: paymentMethod ?? existingSale.paymentMethod,
        discount: newDiscount,
        grandTotal: newGrandTotal,
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    await recordAuditLog(
      userName,
      'SALE_UPDATE',
      `Mengubah data penjualan invoice ${updatedSale.invoiceNo} (Pelanggan: ${updatedSale.customerName})`
    );

    return NextResponse.json(updatedSale);
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
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
        receivable: { include: { payments: true } },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Transaksi penjualan tidak ditemukan' }, { status: 404 });
    }

    // Revert stock if sale was COMPLETED
    if (sale.status === 'COMPLETED') {
      for (const item of sale.items) {
        const prod = await prisma.product.findUnique({ where: { id: item.productId } });
        if (prod) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: prod.stock + item.qty },
          });

          await prisma.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'STOCK_ADJUSTMENT',
              refNo: `DEL-${sale.invoiceNo}`,
              qtyIn: item.qty,
              qtyOut: 0,
              stockBefore: prod.stock,
              stockAfter: prod.stock + item.qty,
              notes: `Penghapusan Penjualan #${sale.invoiceNo}`,
            },
          });
        }
      }
    }

    // Delete associated receivable & payments if exists
    if (sale.receivable) {
      await prisma.receivablePayment.deleteMany({
        where: { receivableId: sale.receivable.id },
      });
      await prisma.receivable.delete({
        where: { id: sale.receivable.id },
      });
    }

    // Delete sale items & sale record
    await prisma.saleItem.deleteMany({
      where: { saleId: id },
    });

    await prisma.sale.delete({
      where: { id },
    });

    await recordAuditLog('Kasir', 'CANCEL_TRANSACTION', `Menghapus permanen transaksi penjualan ${sale.invoiceNo}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
