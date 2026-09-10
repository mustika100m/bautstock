import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adjustProductStock } from '@/lib/stock';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { supplierInvoiceNo: { contains: search } },
        { supplier: { name: { contains: search } } },
      ];
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
        payable: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(purchases);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      supplierId,
      supplierInvoiceNo = '',
      isPaid = true,
      paidAmount = 0,
      dueDate = null,
      notes = '',
      items = [],
      userName = 'Admin',
    } = body;

    if (!supplierId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Supplier dan daftar barang wajib diisi' }, { status: 400 });
    }

    // Generate purchase invoice number
    const today = new Date();
    const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = await prisma.purchase.count({
      where: {
        invoiceNo: { startsWith: `PUR-${yyyymmdd}` },
      },
    });
    const nextSeq = String(countToday + 1).padStart(3, '0');
    const invoiceNo = `PUR-${yyyymmdd}-${nextSeq}`;

    let totalAmount = 0;
    const processedItems = items.map((item: any) => {
      const subtotal = item.qty * item.buyPrice - (item.discount || 0);
      totalAmount += subtotal;
      return {
        productId: item.productId,
        qty: Number(item.qty),
        buyPrice: Number(item.buyPrice),
        discount: Number(item.discount || 0),
        subtotal,
      };
    });

    const purchase = await prisma.purchase.create({
      data: {
        invoiceNo,
        supplierInvoiceNo: supplierInvoiceNo || `INV-SUP-${invoiceNo}`,
        supplierId,
        totalAmount,
        notes,
        status: 'COMPLETED',
        items: {
          create: processedItems,
        },
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    // Automatically increase product stock & create stock movement ledger entry
    for (const item of processedItems) {
      await adjustProductStock({
        productId: item.productId,
        type: 'PURCHASE',
        refNo: invoiceNo,
        qtyChange: item.qty, // positive to increase stock
        userName,
        notes: `Pembelian barang dari supplier ${purchase.supplier.name} (Invoice: ${invoiceNo})`,
      });

      // Update product buy price if provided
      if (item.buyPrice > 0) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { buyPrice: item.buyPrice },
        });
      }
    }

    // Create Payable record if purchase is tempo or partially paid
    const actualPaid = isPaid ? totalAmount : Number(paidAmount);
    if (actualPaid < totalAmount) {
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);

      await prisma.payable.create({
        data: {
          purchaseId: purchase.id,
          supplierId,
          totalAmount,
          paidAmount: actualPaid,
          remainingAmount: totalAmount - actualPaid,
          dueDate: dueDate ? new Date(dueDate) : defaultDueDate,
          status: actualPaid > 0 ? 'PARTIAL' : 'UNPAID',
        },
      });
    }

    await recordAuditLog(
      userName,
      'PURCHASE_TRANSACTION',
      `Transaksi pembelian ${invoiceNo} dari ${purchase.supplier.name} disimpan. Total: Rp ${totalAmount.toLocaleString('id-ID')}`
    );

    return NextResponse.json(purchase, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
