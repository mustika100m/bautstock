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

export function validateProductImport(rawRows: any[], existingSkus: Set<string>): ImportValidationResult {
  const validRows: ImportedRow[] = [];
  const duplicateRows: { rowNumber: number; sku: string; reason: string }[] = [];
  const errorRows: ImportError[] = [];
  const seenSkusInFile = new Set<string>();

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // header is row 1
    let sku = String(row['SKU'] || row['sku'] || '').trim();
    const materialGrade = String(row['Material/Grade'] || row['Material'] || row['materialGrade'] || row['material'] || '').trim();
    const thread = String(row['Thread'] || row['Metric'] || row['thread'] || row['metric'] || '').trim();
    const itemType = String(row['Jenis Barang'] || row['Jenis'] || row['itemType'] || '').trim();
    const length = String(row['Panjang'] || row['length'] || '').trim();
    const finishing = String(row['Finishing'] || row['finishing'] || '').trim();
    const unit = String(row['Satuan'] || row['unit'] || 'Pcs').trim();
    const stock = Number(row['Stok'] || row['stock'] || 0);
    const buyPrice = Number(row['Harga Beli'] || row['Harga Beli (Modal)'] || row['buyPrice'] || 0);
    const retailPrice = Number(row['Harga Retail'] || row['retailPrice'] || 0);
    const wholesalePrice = Number(row['Harga Grosir'] || row['wholesalePrice'] || 0);
    const lokasi = String(row['Lokasi'] || row['location'] || '').trim();

    let category = String(row['Kategori'] || row['category'] || '').trim();
    if (!category && itemType) {
      category = itemType.trim().split(/\s+/)[0] || 'Baut';
    }
    if (!category) category = 'Baut';

    if (!itemType && !materialGrade) {
      errorRows.push({ rowNumber: rowNum, sku: sku || '-', reason: 'Spesifikasi produk (Jenis Barang / Material) tidak boleh kosong' });
      return;
    }

    if (!sku) {
      sku = generateAutoSku({ category, itemType, thread, length, materialGrade, finishing });
    }

    if (seenSkusInFile.has(sku)) {
      duplicateRows.push({ rowNumber: rowNum, sku, reason: 'SKU duplikat dalam file Excel' });
      return;
    }

    if (existingSkus.has(sku)) {
      duplicateRows.push({ rowNumber: rowNum, sku, reason: 'SKU sudah terdaftar di database' });
      return;
    }

    seenSkusInFile.add(sku);

    // Auto Name order: [MATL] [THREAD] [JENIS BARANG] [PANJANG] [FINISHING]
    const name = `${materialGrade || 'GR 4.6'} ${thread || 'FT'} ${itemType || 'Baut Mur Hex'} ${length || ''} ${finishing || ''}`.replace(/\s+/g, ' ').trim();

    validRows.push({
      sku,
      name,
      category,
      itemType: itemType || 'Baut Mur Hex',
      metric: thread || 'FT',
      length: length || '-',
      material: materialGrade || 'GR 4.6',
      grade: '-',
      materialGrade,
      finishing: finishing || 'HTM',
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
