import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { username, name, password, role, active, adminUserName = 'Owner' } = body;

    const currentUser = await prisma.user.findUnique({ where: { id } });
    if (!currentUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (password) updateData.password = password;
    if (role) updateData.role = role;
    if (active !== undefined) updateData.active = Boolean(active);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    await recordAuditLog(
      adminUserName,
      'EDIT_USER',
      `Mengubah data/role pengguna ${updatedUser.username} menjadi ${updatedUser.role} (Status: ${updatedUser.active ? 'Aktif' : 'Nonaktif'})`
    );

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // Delete user from database permanently
    await prisma.user.delete({
      where: { id },
    });

    await recordAuditLog('Owner', 'EDIT_USER', `Menghapus akun pengguna ${user.username} (${user.name})`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
