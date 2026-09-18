export interface ProductSpecInput {
  category?: string;
  itemType?: string;
  metric?: string;
  thread?: string;
  length?: string;
  material?: string;
  grade?: string;
  materialGrade?: string;
  finishing?: string;
}

export function generateAutoSku(spec: ProductSpecInput): string {
  // 1. Material / Grade (e.g. GR 4.6 -> GR4.6, SUS 304 -> SUS304)
  let rawMat = (spec.materialGrade || `${spec.material || ''} ${spec.grade || ''}`.trim() || 'GR 4.6').trim();
  let matCode = rawMat.replace(/\s+/g, '').toUpperCase();

  // 2. Thread (e.g. FT, HT)
  let rawThread = (spec.thread || spec.metric || 'FT').trim();
  let threadCode = rawThread.replace(/\s+/g, '').toUpperCase();

  // 3. Jenis Barang (e.g. Baut Mur Hex M.5-P0.80-K8 -> BMH-M.5-P0.80-K8)
  let rawItemType = (spec.itemType || 'Baut Mur Hex M.5-P0.80-K8').trim();
  let itemCode = rawItemType
    .replace(/Baut Mur Hex/gi, 'BMH')
    .replace(/Baut Hex/gi, 'BH')
    .replace(/Mur Hex/gi, 'MH')
    .replace(/\s+/g, '-')
    .toUpperCase();

  // 4. Panjang (e.g. 8 MM -> 8MM)
  let rawLength = (spec.length || '8 MM').trim();
  let lengthCode = rawLength.replace(/\s+/g, '').toUpperCase();

  // 5. Finishing (e.g. HTM, PTH, KNG, UCP, HDG)
  let rawFinishing = (spec.finishing || 'HTM').trim();
  let finishingCode = rawFinishing.replace(/\s+/g, '').toUpperCase();

  // Exact order: MATL - THREAD - JENIS BARANG - PANJANG - FINISHING
  const parts = [matCode, threadCode, itemCode, lengthCode, finishingCode].filter(Boolean);
  return parts.join('-');
}
