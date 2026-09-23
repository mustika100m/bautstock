import { generateAutoSku } from '@/lib/sku';

export interface ImportedRow {
  sku: string;
  name: string;
  category: string;
  itemType: string;
  metric: string;
  length: string;
  material: string;
  grade: string;
  materialGrade?: string;
  finishing: string;
  unit: string;
  stock: number;
  buyPrice: number;
  cashPrice: number;
  tempoPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  warehouse?: string;
  rackLocation?: string;
  boxBin?: string;
  barcode?: string;
}

export interface ImportError {
  rowNumber: number;
  sku: string;
  reason: string;
}

export interface ImportValidationResult {
  validRows: ImportedRow[];
  duplicateRows: { rowNumber: number; sku: string; reason: string }[];
  errorRows: ImportError[];
}

function getVal(row: any, ...keys: string[]): string {
  if (!row || typeof row !== 'object') return '';
  const normMap: { [k: string]: any } = {};
  for (const k of Object.keys(row)) {
    const cleanKey = k.replace(/[\r\n\t]/g, '').trim().toLowerCase();
    normMap[cleanKey] = row[k];
  }
  for (const key of keys) {
    const cleanTarget = key.replace(/[\r\n\t]/g, '').trim().toLowerCase();
    if (normMap[cleanTarget] !== undefined && normMap[cleanTarget] !== null && String(normMap[cleanTarget]).trim() !== '') {
      return String(normMap[cleanTarget]).trim();
    }
  }
  return '';
}

export function validateProductImport(
  rawRows: any[],
  existingSkus: Set<string>,
  existingSpecs: Set<string> = new Set(),
  activeSkus: Set<string> = new Set(),
  activeSpecs: Set<string> = new Set(),
  inactiveSkus: Set<string> = new Set(),
  inactiveSpecs: Set<string> = new Set()
): ImportValidationResult {
  const validRows: ImportedRow[] = [];
  const duplicateRows: { rowNumber: number; sku: string; reason: string }[] = [];
  const errorRows: ImportError[] = [];
  const seenSkusInFile = new Set<string>();
  const seenSpecsInFile = new Set<string>();

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // header is row 1
    let explicitSku = getVal(row, 'SKU', 'sku', 'Kode Barang');
    const materialGrade = getVal(row, 'Material/Grade', 'Material / Grade', 'Material', 'materialGrade', 'material');
    const thread = getVal(row, 'Thread', 'Metric', 'thread', 'metric');
    const itemType = getVal(row, 'Jenis Barang', 'Jenis', 'itemType');
    const length = getVal(row, 'Panjang', 'length');
    const finishing = getVal(row, 'Finishing', 'finishing');
    const unit = getVal(row, 'Satuan', 'unit') || 'Pcs';
    const stock = Number(getVal(row, 'Stok', 'stock') || 0);
    const buyPrice = Number(getVal(row, 'Harga Beli', 'Harga Beli (Modal)', 'buyPrice') || 0);
    const retailPrice = Number(getVal(row, 'Harga Retail', 'retailPrice') || 0);
    const wholesalePrice = Number(getVal(row, 'Harga Grosir', 'wholesalePrice') || 0);
    const lokasi = getVal(row, 'Lokasi', 'location');

    let category = getVal(row, 'Kategori', 'category');
    if (!category && itemType) {
      category = itemType.trim().split(/\s+/)[0] || 'Baut';
    }
    if (!category) category = 'Baut';

    if (!itemType && !materialGrade) {
      errorRows.push({ rowNumber: rowNum, sku: explicitSku || '-', reason: 'Spesifikasi produk (Jenis Barang / Material) tidak boleh kosong' });
      return;
    }

    const specKey = `${category}|${itemType}|${thread}|${length}|${materialGrade}|-|${finishing}`.toLowerCase();

    if (seenSpecsInFile.has(specKey)) {
      duplicateRows.push({ rowNumber: rowNum, sku: explicitSku || '-', reason: 'Spesifikasi produk duplikat dalam file Excel' });
      return;
    }
    seenSpecsInFile.add(specKey);

    const baseSku = generateAutoSku({ category, itemType, thread, length, materialGrade, finishing });
    let isOldAutoSku = false;
    if (explicitSku) {
      if (!thread && /-FT-/i.test(explicitSku)) isOldAutoSku = true;
      if (!finishing && /-HTM$/i.test(explicitSku)) isOldAutoSku = true;
      if (!length && /-8MM-/i.test(explicitSku)) isOldAutoSku = true;
      if (!materialGrade && /^GR4\.6-/i.test(explicitSku)) isOldAutoSku = true;
    }
    let sku = (!explicitSku || isOldAutoSku) ? baseSku : explicitSku;

    if (seenSkusInFile.has(sku)) {
      duplicateRows.push({ rowNumber: rowNum, sku, reason: 'SKU duplikat dalam file Excel' });
      return;
    }
    seenSkusInFile.add(sku);

    const isActiveInDb = (sku && activeSkus.has(sku)) || activeSpecs.has(specKey);

    if (isActiveInDb) {
      duplicateRows.push({ rowNumber: rowNum, sku, reason: 'SKU / Spesifikasi barang sudah terdaftar dan aktif di database' });
      return;
    }

    // Auto Name order: [MATL] [THREAD] [JENIS BARANG] [PANJANG] [FINISHING]
    const name = [materialGrade, thread, itemType, length, finishing].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

    validRows.push({
      sku,
      name,
      category,
      itemType: itemType || '',
      metric: thread || '',
      length: length || '',
      material: materialGrade || '',
      grade: '-',
      materialGrade,
      finishing: finishing || '',
      unit,
      stock,
      buyPrice,
      cashPrice: retailPrice,
      tempoPrice: wholesalePrice,
      retailPrice,
      wholesalePrice,
      warehouse: 'Gudang Utama',
      rackLocation: lokasi || 'Rak A',
      boxBin: 'A-01',
    });
  });

  return { validRows, duplicateRows, errorRows };
}
