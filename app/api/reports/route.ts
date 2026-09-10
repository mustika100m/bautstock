import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'stok';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      dateFilter.lte = eDate;
    }

    if (type === 'stok') {
      const products = await prisma.product.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
      });
      const totalNilaiPersediaan = products.reduce((sum, p) => sum + p.stock * p.buyPrice, 0);
      return NextResponse.json({ products, summary: { totalSku: products.length, totalNilaiPersediaan } });
    }

    if (type === 'barang-habis') {
      const products = await prisma.product.findMany({
        where: { status: 'ACTIVE', stock: 0 },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json({ products });
    }

    if (type === 'stok-minimum') {
      const allProducts = await prisma.product.findMany({ where: { status: 'ACTIVE' } });
      const products = allProducts.filter((p) => p.stock <= p.minStock);
      return NextResponse.json({ products });
    }

    if (type === 'penjualan') {
      const sales = await prisma.sale.findMany({
        where: {
          status: 'COMPLETED',
          ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
        include: { customer: true, items: { include: { product: true } } },
        orderBy: { date: 'desc' },
      });
      const totalOmset = sales.reduce((sum, s) => sum + s.grandTotal, 0);
      return NextResponse.json({ sales, summary: { totalTransaksi: sales.length, totalOmset } });
    }

    if (type === 'pembelian') {
      const purchases = await prisma.purchase.findMany({
        where: {
          status: 'COMPLETED',
          ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
        include: { supplier: true, items: { include: { product: true } } },
        orderBy: { date: 'desc' },
      });
      const totalPengeluaran = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
      return NextResponse.json({ purchases, summary: { totalTransaksi: purchases.length, totalPengeluaran } });
    }

    if (type === 'laba-kotor') {
      const sales = await prisma.sale.findMany({
        where: {
          status: 'COMPLETED',
          ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
        include: { items: { include: { product: true } } },
      });

      let totalPenjualan = 0;
      let totalHpp = 0;

      sales.forEach((sale) => {
        totalPenjualan += sale.grandTotal;
        sale.items.forEach((item) => {
          totalHpp += item.qty * item.product.buyPrice;
        });
      });

      const labaKotor = totalPenjualan - totalHpp;
      return NextResponse.json({ summary: { totalPenjualan, totalHpp, labaKotor } });
    }

    if (type === 'barang-terlaris') {
      const saleItems = await prisma.saleItem.findMany({
        where: {
          sale: {
            status: 'COMPLETED',
            ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
          },
        },
        include: { product: true },
      });

      const aggregated: Record<string, { product: any; totalQty: number; totalRevenue: number }> = {};

      saleItems.forEach((item) => {
        if (!aggregated[item.productId]) {
          aggregated[item.productId] = {
            product: item.product,
            totalQty: 0,
            totalRevenue: 0,
          };
        }
        aggregated[item.productId].totalQty += item.qty;
        aggregated[item.productId].totalRevenue += item.subtotal;
      });

      const result = Object.values(aggregated).sort((a, b) => b.totalQty - a.totalQty);
      return NextResponse.json({ items: result });
    }

    if (type === 'penjualan-pelanggan') {
      const customers = await prisma.customer.findMany({
        include: {
          sales: {
            where: {
              status: 'COMPLETED',
              ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
            },
          },
        },
      });

      const result = customers.map((c) => {
        const totalAmount = c.sales.reduce((sum, s) => sum + s.grandTotal, 0);
        return { customer: c, totalTransaksi: c.sales.length, totalAmount };
      }).sort((a, b) => b.totalAmount - a.totalAmount);

      return NextResponse.json({ items: result });
    }

    if (type === 'pembelian-supplier') {
      const suppliers = await prisma.supplier.findMany({
        include: {
          purchases: {
            where: {
              status: 'COMPLETED',
              ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
            },
          },
        },
      });

      const result = suppliers.map((s) => {
        const totalAmount = s.purchases.reduce((sum, p) => sum + p.totalAmount, 0);
        return { supplier: s, totalTransaksi: s.purchases.length, totalAmount };
      }).sort((a, b) => b.totalAmount - a.totalAmount);

      return NextResponse.json({ items: result });
    }

    return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
