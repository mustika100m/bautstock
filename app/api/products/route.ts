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
    const metric = searchParams.get('metric') || searchParams.get('thread') || '';
    const thread = searchParams.get('thread') || searchParams.get('metric') || '';
    const length = searchParams.get('length') || '';
    const material = searchParams.get('material') || '';
    const grade = searchParams.get('grade') || '';
    const materialGrade = searchParams.get('materialGrade') || '';
    const finishing = searchParams.get('finishing') || '';
    const minStockOnly = searchParams.get('minStockOnly') === 'true';

    const where: any = {
      status: 'ACTIVE',
    };

    if (search && search.trim() !== '') {
      const keywords = search.trim().split(/\s+/).filter(Boolean);
      where.AND = keywords.map((kw) => ({
        OR: [
          { name: { contains: kw, mode: 'insensitive' } },
          { sku: { contains: kw, mode: 'insensitive' } },
          { barcode: { contains: kw, mode: 'insensitive' } },
          { category: { contains: kw, mode: 'insensitive' } },
          { itemType: { contains: kw, mode: 'insensitive' } },
          { metric: { contains: kw, mode: 'insensitive' } },
          { length: { contains: kw, mode: 'insensitive' } },
          { material: { contains: kw, mode: 'insensitive' } },
          { grade: { contains: kw, mode: 'insensitive' } },
          { finishing: { contains: kw, mode: 'insensitive' } },
        ],
      }));
    }

    if (barcode) {
      where.barcode = barcode;
    }

    if (category) where.category = category;
    if (itemType) where.itemType = itemType;
    if (thread) where.metric = { contains: thread, mode: 'insensitive' };
    if (length) where.length = length;
    if (material) where.material = material;
    if (grade) where.grade = grade;
    if (materialGrade) {
      where.OR = [
        { material: { contains: materialGrade, mode: 'insensitive' } },
        { grade: { contains: materialGrade, mode: 'insensitive' } },
      ];
    }
    if (finishing) where.finishing = finishing;

    let products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    if (minStockOnly) {
      products = products.filter((p) => p.stock <= p.minStock);
    }

    // Fetch distinct spec values for cascading dropdowns
    const allActive = await prisma.product.findMany({ where: { status: 'ACTIVE' } });
    const materialGrades = Array.from(new Set(allActive.map((p) => `${p.material} ${p.grade}`.replace(/-$/, '').trim()))).filter(Boolean).sort();
    const threads = Array.from(new Set(allActive.map((p) => p.metric))).filter(Boolean).sort();
    const itemTypes = Array.from(new Set(allActive.map((p) => p.itemType))).filter(Boolean).sort();
    const lengths = Array.from(new Set(allActive.map((p) => p.length))).filter(Boolean).sort();
    const finishings = Array.from(new Set(allActive.map((p) => p.finishing))).filter(Boolean).sort();

    return NextResponse.json({
      products,
      specs: {
        materialGrades,
        threads,
        itemTypes,
        lengths,
        finishings,
        categories: Array.from(new Set(allActive.map((p) => p.category))).filter(Boolean).sort(),
        metrics: threads,
        materials: Array.from(new Set(allActive.map((p) => p.material))).filter(Boolean).sort(),
        grades: Array.from(new Set(allActive.map((p) => p.grade))).filter(Boolean).sort(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let {
      sku,
      name,
      category,
      itemType,
      metric,
      thread,
      length,
      material,
      grade,
      materialGrade,
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

    const finalMetric = thread || metric || 'M8';
    const rawItemType = itemType || 'Hex Bolt';
    if (!category && rawItemType) {
      const firstWord = rawItemType.trim().split(/\s+/)[0];
      category = firstWord;
    }
    if (!category) category = 'Baut';

    let finalMaterial = material || '';
    let finalGrade = grade || '';
    if (materialGrade) {
      const gradeMatch = materialGrade.match(/(12\.9|10\.9|8\.8|4\.8|316|304|A4-80|A2-70|Class 10|Class 8)/i);
      if (gradeMatch) {
        finalGrade = gradeMatch[1].toUpperCase();
        finalMaterial = materialGrade.replace(gradeMatch[0], '').replace(/[()]/g, '').trim() || 'Baja Karbon';
      } else {
        finalMaterial = materialGrade;
        finalGrade = '-';
      }
    } else {
      if (!finalMaterial) finalMaterial = 'Baja Karbon';
      if (!finalGrade) finalGrade = '8.8';
    }

    const finalSku = (sku && sku.trim() !== '')
      ? sku.trim()
      : generateAutoSku({ category, itemType: rawItemType, thread: finalMetric, length, materialGrade: materialGrade || `${finalMaterial} ${finalGrade}` });

    // Check SKU duplicate
    const existingSku = await prisma.product.findUnique({ where: { sku: finalSku } });
    if (existingSku) {
      return NextResponse.json({ error: `SKU "${finalSku}" sudah digunakan oleh produk lain` }, { status: 400 });
    }

    const autoName = name || `${rawItemType} ${finalMetric} ${length || ''} ${materialGrade || `${finalMaterial} ${finalGrade}`} ${finishing || ''}`.replace(/\s+/g, ' ').trim();

    const product = await prisma.product.create({
      data: {
        sku: finalSku,
        name: autoName,
        category,
        itemType: rawItemType,
        metric: finalMetric,
        length: length || '-',
        material: finalMaterial,
        grade: finalGrade,
        finishing: finishing || 'Zinc Plating',
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
