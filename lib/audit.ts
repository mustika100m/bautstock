import { prisma } from './prisma';

export async function recordAuditLog(userName: string, action: string, details: string, userId?: string) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        userName: userName || 'Sistem',
        action,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
