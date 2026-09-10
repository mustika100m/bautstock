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
    const category = String(row['Kategori'] || row['category'] || '').trim();
    const itemType = String(row['Jenis'] || row['itemType'] || '').trim();
    const metric = String(row['Metric'] || row['metric'] || '').trim();
    const length = String(row['Panjang'] || row['length'] || '').trim();
    const material = String(row['Material'] || row['material'] || '').trim();
    const grade = String(row['Grade'] || row['grade'] || '').trim();
    const finishing = String(row['Finishing'] || row['finishing'] || '').trim();
    const unit = String(row['Satuan'] || row['unit'] || 'Pcs').trim();
    const stock = Number(row['Stok'] || row['stock'] || 0);
    const buyPrice = Number(row['Harga Beli'] || row['buyPrice'] || 0);
    const cashPrice = Number(row['Harga Cash'] || row['cashPrice'] || 0);
    const tempoPrice = Number(row['Harga Tempo'] || row['tempoPrice'] || 0);
    const retailPrice = Number(row['Harga Retail'] || row['retailPrice'] || 0);
    const wholesalePrice = Number(row['Harga Grosir'] || row['wholesalePrice'] || 0);
    const lokasi = String(row['Lokasi'] || row['location'] || '').trim();

    if (!category) {
      errorRows.push({ rowNumber: rowNum, sku: sku || '-', reason: 'Kategori tidak boleh kosong' });
      return;
    }

    if (!sku) {
      sku = generateAutoSku({ category, itemType, metric, length, material, grade, finishing });
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

    const name = `${category} ${itemType} ${metric} ${length} ${material} ${grade} ${finishing}`.replace(/\s+/g, ' ').trim();

    validRows.push({
      sku,
      name,
      category,
      itemType: itemType || 'Standard',
      metric: metric || '-',
      length: length || '-',
      material: material || 'Baja Karbon',
      grade: grade || '8.8',
      finishing: finishing || 'Zinc',
      unit,
      stock,
      buyPrice,
      cashPrice,
      tempoPrice,
      retailPrice,
      wholesalePrice,
      warehouse: 'Gudang Utama',
      rackLocation: lokasi || 'Rak A',
      boxBin: 'A-01',
    });
  });

  return { validRows, duplicateRows, errorRows };
}
