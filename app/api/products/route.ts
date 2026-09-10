import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';
import { generateAutoSku } from '@/lib/sku';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const barcode = searchParams.get('barcode') || '';
    const category = searchParams.get('category') || '';
    const itemType = searchParams.get('itemType') || '';
    const metric = searchParams.get('metric') || '';
    const length = searchParams.get('length') || '';
    const material = searchParams.get('material') || '';
    const grade = searchParams.get('grade') || '';
    const finishing = searchParams.get('finishing') || '';
    const minStockOnly = searchParams.get('minStockOnly') === 'true';

    const where: any = {
      status: 'ACTIVE',
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
        { category: { contains: search } },
        { itemType: { contains: search } },
      ];
    }

    if (barcode) {
      where.barcode = barcode;
    }

    if (category) where.category = category;
    if (itemType) where.itemType = itemType;
    if (metric) where.metric = metric;
    if (length) where.length = length;
    if (material) where.material = material;
    if (grade) where.grade = grade;
    if (finishing) where.finishing = finishing;

    let products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    if (minStockOnly) {
      products = products.filter((p) => p.stock <= p.minStock);
    }

    // Also fetch distinct spec values for cascading dropdowns
    const allActive = await prisma.product.findMany({ where: { status: 'ACTIVE' } });
    const categories = Array.from(new Set(allActive.map((p) => p.category))).filter(Boolean).sort();
    const itemTypes = Array.from(new Set(allActive.filter((p) => !category || p.category === category).map((p) => p.itemType))).filter(Boolean).sort();
    const metrics = Array.from(new Set(allActive.filter((p) => (!category || p.category === category) && (!itemType || p.itemType === itemType)).map((p) => p.metric))).filter(Boolean).sort();
    const lengths = Array.from(new Set(allActive.filter((p) => (!category || p.category === category) && (!itemType || p.itemType === itemType) && (!metric || p.metric === metric)).map((p) => p.length))).filter(Boolean).sort();
    const materials = Array.from(new Set(allActive.map((p) => p.material))).filter(Boolean).sort();
    const grades = Array.from(new Set(allActive.map((p) => p.grade))).filter(Boolean).sort();
    const finishings = Array.from(new Set(allActive.map((p) => p.finishing))).filter(Boolean).sort();

    return NextResponse.json({
      products,
      specs: {
        categories,
        itemTypes,
        metrics,
        lengths,
        materials,
        grades,
        finishings,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sku,
      name,
      category,
      itemType,
      metric,
      length,
      material,
      grade,
      finishing,
      unit,
      pcsPerBox,
      warehouse,
      rackLocation,
      boxBin,
      stock,
      minStock,
      buyPrice,
      cashPrice,
      tempoPrice,
      retailPrice,
      wholesalePrice,
      barcode,
      userName = 'Admin',
    } = body;

    if (!category || !itemType) {
      return NextResponse.json({ error: 'Kategori dan Jenis wajib diisi' }, { status: 400 });
    }

    const finalSku = (sku && sku.trim() !== '')
      ? sku.trim()
      : generateAutoSku({ category, itemType, metric, length, material, grade, finishing });

    // Check SKU duplicate
    const existingSku = await prisma.product.findUnique({ where: { sku: finalSku } });
    if (existingSku) {
      return NextResponse.json({ error: `SKU "${finalSku}" sudah digunakan oleh produk lain` }, { status: 400 });
    }

    // Check spec combination duplicate
    const existingSpec = await prisma.product.findFirst({
      where: {
        category,
        itemType,
        metric: metric || '-',
        length: length || '-',
        material: material || 'Baja Karbon',
        grade: grade || '8.8',
        finishing: finishing || 'Zinc',
      },
    });

    if (existingSpec) {
      return NextResponse.json(
        { error: `Produk dengan spesifikasi persis yang sama sudah ada: (${existingSpec.sku} - ${existingSpec.name})` },
        { status: 400 }
      );
    }

    const autoName = name || `${category} ${itemType} ${metric} ${length} ${material} ${grade} ${finishing}`.replace(/\s+/g, ' ').trim();

    const product = await prisma.product.create({
      data: {
        sku: finalSku,
        name: autoName,
        category,
        itemType,
        metric: metric || '-',
        length: length || '-',
        material: material || 'Baja Karbon',
        grade: grade || '8.8',
        finishing: finishing || 'Zinc',
        unit: unit || 'Pcs',
        pcsPerBox: Number(pcsPerBox) || 100,
        warehouse: warehouse || 'Gudang Utama',
        rackLocation: rackLocation || 'Rak A',
        boxBin: boxBin || 'A-01',
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 10,
        buyPrice: Number(buyPrice) || 0,
        cashPrice: Number(cashPrice) || 0,
        tempoPrice: Number(tempoPrice) || 0,
        retailPrice: Number(retailPrice) || 0,
        wholesalePrice: Number(wholesalePrice) || 0,
        barcode: barcode || null,
      },
    });

    // Create initial stock movement if stock > 0
    if (product.stock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'INITIAL_STOCK',
          refNo: `INIT-${product.sku}`,
          qtyIn: product.stock,
          qtyOut: 0,
          stockBefore: 0,
          stockAfter: product.stock,
          userName,
          notes: 'Stok awal pendaftaran produk',
        },
      });
    }

    await recordAuditLog(userName, 'ADD_PRODUCT', `Menambah barang baru: ${product.name} (SKU: ${product.sku})`);

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
