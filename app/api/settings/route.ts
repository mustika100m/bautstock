import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    let setting = await prisma.storeSetting.findFirst();
    if (!setting) {
      setting = await prisma.storeSetting.create({
        data: { id: '1' },
      });
    }
    return NextResponse.json(setting);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleSaveSettings(req: NextRequest) {
  try {
    const body = await req.json();
    const { userName = 'Owner', storeName, address, phone, receiptHeader, receiptFooter, allowNegativeStock } = body;

    const payload = {
      storeName: storeName ?? 'MUSTIKA BAUT',
      address: address ?? '',
      phone: phone ?? '',
      receiptHeader: receiptHeader ?? '',
      receiptFooter: receiptFooter ?? '',
      allowNegativeStock: Boolean(allowNegativeStock),
    };

    let setting = await prisma.storeSetting.findFirst();
    if (!setting) {
      setting = await prisma.storeSetting.create({
        data: { id: '1', ...payload },
      });
    } else {
      setting = await prisma.storeSetting.update({
        where: { id: setting.id },
        data: payload,
      });
    }

    await recordAuditLog(
      userName,
      'SETTINGS_UPDATE',
      `Mengubah pengaturan toko & kebijakan stok negatif: ${payload.allowNegativeStock ? 'Diizinkan' : 'Dilarang'}`
    );

    return NextResponse.json(setting);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return handleSaveSettings(req);
}

export async function POST(req: NextRequest) {
  return handleSaveSettings(req);
}
