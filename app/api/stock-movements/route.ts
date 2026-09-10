import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const productId = searchParams.get('productId') || '';

    const where: any = {};
    if (productId) {
      where.productId = productId;
    }
    if (type) {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { product: { name: { contains: search } } },
        { product: { sku: { contains: search } } },
        { refNo: { contains: search } },
        { userName: { contains: search } },
      ];
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 200,
    });

    return NextResponse.json(movements);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
