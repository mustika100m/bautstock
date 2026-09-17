import { prisma } from '@/lib/prisma';

export async function generateUniqueCustomerCode(providedCode?: string): Promise<string> {
  if (providedCode && providedCode.trim() !== '') {
    return providedCode.trim();
  }

  const lastCustomer = await prisma.customer.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { code: true },
  });

  let num = 1;
  if (lastCustomer && lastCustomer.code) {
    const match = lastCustomer.code.match(/PLG-(\d+)/i);
    if (match) {
      num = parseInt(match[1], 10) + 1;
    }
  }

  let code = `PLG-${String(num).padStart(4, '0')}`;
  while (await prisma.customer.findUnique({ where: { code } })) {
    num++;
    code = `PLG-${String(num).padStart(4, '0')}`;
  }
  return code;
}

export async function generateUniqueSupplierCode(providedCode?: string): Promise<string> {
  if (providedCode && providedCode.trim() !== '') {
    return providedCode.trim();
  }

  const lastSupplier = await prisma.supplier.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { code: true },
  });

  let num = 1;
  if (lastSupplier && lastSupplier.code) {
    const match = lastSupplier.code.match(/SUP-(\d+)/i);
    if (match) {
      num = parseInt(match[1], 10) + 1;
    }
  }

  let code = `SUP-${String(num).padStart(4, '0')}`;
  while (await prisma.supplier.findUnique({ where: { code } })) {
    num++;
    code = `SUP-${String(num).padStart(4, '0')}`;
  }
  return code;
}
