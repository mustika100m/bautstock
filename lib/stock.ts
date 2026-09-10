import { prisma } from './prisma';

export type MovementType =
  | 'PURCHASE'
  | 'SALE'
  | 'STOCK_ADJUSTMENT'
  | 'RETURN_IN'
  | 'RETURN_OUT'
  | 'INITIAL_STOCK';

export interface StockChangeRequest {
  productId: string;
  type: MovementType;
  refNo?: string;
  qtyChange: number; // positive for addition, negative for deduction
  userName: string;
  userId?: string;
  notes?: string;
}

export async function adjustProductStock(req: StockChangeRequest) {
  const storeSetting = await prisma.storeSetting.findFirst();
  const allowNegative = storeSetting?.allowNegativeStock ?? false;

  const product = await prisma.product.findUnique({
    where: { id: req.productId },
  });

  if (!product) {
    throw new Error('Produk tidak ditemukan');
  }

  const stockBefore = product.stock;
  const newStock = stockBefore + req.qtyChange;

  if (newStock < 0 && !allowNegative) {
    throw new Error(`Stok tidak mencukupi untuk "${product.name}". Stok tersedia: ${stockBefore}, dibutuhkan: ${Math.abs(req.qtyChange)}`);
  }

  const qtyIn = req.qtyChange > 0 ? req.qtyChange : 0;
  const qtyOut = req.qtyChange < 0 ? Math.abs(req.qtyChange) : 0;

  // Update product stock and record stock movement in a transaction
  const [updatedProduct, movement] = await prisma.$transaction([
    prisma.product.update({
      where: { id: req.productId },
      data: { stock: newStock },
    }),
    prisma.stockMovement.create({
      data: {
        productId: req.productId,
        type: req.type,
        refNo: req.refNo || null,
        qtyIn,
        qtyOut,
        stockBefore,
        stockAfter: newStock,
        userName: req.userName,
        userId: req.userId || null,
        notes: req.notes || null,
      },
    }),
  ]);

  return { updatedProduct, movement };
}
