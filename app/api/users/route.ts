import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username, name, password, role = 'KASIR', adminUserName = 'Owner' } = await req.json();

    if (!username || !name || !password) {
      return NextResponse.json({ error: 'Username, nama, dan password wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: `Username "${username}" sudah digunakan` }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: { username, name, password, role },
    });

    await recordAuditLog(adminUserName, 'ADD_USER', `Menambahkan pengguna baru: ${user.name} (${user.role})`);

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
