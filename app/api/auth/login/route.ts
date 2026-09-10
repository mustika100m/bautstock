import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: cleanUsername,
          mode: 'insensitive',
        },
      },
    });

    if (!user || user.password !== cleanPassword || !user.active) {
      return NextResponse.json({ error: 'Username atau password salah / akun nonaktif' }, { status: 401 });
    }

    await recordAuditLog(user.name, 'LOGIN', `Pengguna ${user.username} (${user.role}) berhasil login ke sistem`);

    return NextResponse.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
