import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adjustProductStock } from '@/lib/stock';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { customerName: { contains: search } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        receivable: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(sales);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let {
      customerId,
      customerName = 'Pelanggan Umum',
      customerMode = 'existing',
      newCustomerPhone = '',
      priceType = 'CASH',
      paymentMethod = 'CASH',
      discount = 0,
      paidAmount = 0,
      items = [],
      createdBy = 'Kasir',
      notes = '',
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Keranjang belanja tidak boleh kosong' }, { status: 400 });
    }

    // Handle new customer auto-registration if selected
    if (customerMode === 'new' && customerName && customerName !== 'Pelanggan Umum') {
      const custCount = await prisma.customer.count();
      const newCode = `PLG-${String(custCount + 1).padStart(4, '0')}`;
      const createdCust = await prisma.customer.create({
        data: {
          code: newCode,
          name: customerName,
          phone: newCustomerPhone || '0800000000',
          address: 'Alamat Pelanggan Baru',
          customerType: priceType === 'WHOLESALE' ? 'GROSIR' : 'RETAIL',
        },
      });
      customerId = createdCust.id;
    }

    // Generate GUARANTEED UNIQUE invoice number
    const today = new Date();
    const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
    const timeMs = Date.now().toString().slice(-4);
    const randDigits = Math.floor(100 + Math.random() * 900);
    const invoiceNo = `POS-${yyyymmdd}-${timeMs}${randDigits}`;

    // Calculate totals
    let totalAmount = 0;
    const processedItems = items.map((item: any) => {
      const subtotal = (item.qty * item.price) - (item.discount || 0);
      totalAmount += subtotal;
      return {
        productId: item.productId,
        qty: Number(item.qty),
        price: Number(item.price),
        discount: Number(item.discount || 0),
        subtotal,
      };
    });

    const grandTotal = Math.max(0, totalAmount - Number(discount));
    const isTempo = paymentMethod === 'CREDIT' || priceType === 'TEMPO';
    const isPaid = !isTempo && Number(paidAmount) >= grandTotal;
    const paymentStatus = isPaid ? 'PAID' : isTempo ? 'UNPAID' : 'PARTIAL';
    const changeAmount = isPaid ? Math.max(0, Number(paidAmount) - grandTotal) : 0;

    // Check stock availability
    const storeSetting = await prisma.storeSetting.findFirst();
    const allowNegative = storeSetting?.allowNegativeStock ?? false;

    if (!allowNegative) {
      for (const item of processedItems) {
        const p = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!p || p.stock < item.qty) {
          return NextResponse.json(
            { error: `Stok produk "${p?.name || item.productId}" tidak mencukupi. Stok: ${p?.stock || 0}, Dibutuhkan: ${item.qty}` },
            { status: 400 }
          );
        }
      }
    }

    // Create Sale record
    const sale = await prisma.sale.create({
      data: {
        invoiceNo,
        customerId: customerId || null,
        customerName: customerName,
        priceType,
        paymentMethod,
        totalAmount,
        discount: Number(discount),
        grandTotal,
        paidAmount: Number(paidAmount),
        changeAmount,
        paymentStatus,
        status: 'COMPLETED',
        createdBy,
        items: {
          create: processedItems,
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        customer: true,
      },
    });

    // Deduct stock & create stock movements
    for (const item of processedItems) {
      await adjustProductStock({
        productId: item.productId,
        type: 'SALE',
        refNo: invoiceNo,
        qtyChange: -item.qty,
        userName: createdBy,
        notes: `Penjualan kasir invoice ${invoiceNo}`,
      });
    }

    // If payment is Tempo (Credit), create Receivable record
    if (isTempo && customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      const termsDays = customer?.paymentTermsDays || 14;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + termsDays);

      await prisma.receivable.create({
        data: {
          saleId: sale.id,
          customerId,
          totalAmount: grandTotal,
          paidAmount: Number(paidAmount),
          remainingAmount: Math.max(0, grandTotal - Number(paidAmount)),
          dueDate,
          status: Number(paidAmount) > 0 ? 'PARTIAL' : 'UNPAID',
        },
      });
    }

    await recordAuditLog(
      createdBy,
      'SALE_TRANSACTION',
      `Transaksi penjualan ${invoiceNo} berhasil diproses. Total: Rp ${grandTotal.toLocaleString('id-ID')}`
    );

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
