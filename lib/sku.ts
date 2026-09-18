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
  const catCodeMap: { [k: string]: string } = {
    'Baut': 'BT',
    'Mur': 'MR',
    'Ring': 'RG',
    'Sekrup': 'SK',
    'Anchor': 'ANC',
    'Pin & Clip': 'PIN',
    'Klem': 'KLM',
    'Stud Bolt': 'STB',
    'Fisher': 'FSH',
    'Rivet': 'RVT',
  };

  let category = spec.category || '';
  let rawItemType = spec.itemType || '';
  if (!category && rawItemType) {
    const firstWord = rawItemType.trim().split(/\s+/)[0];
    if (catCodeMap[firstWord]) {
      category = firstWord;
      rawItemType = rawItemType.replace(firstWord, '').trim();
    }
  }
  if (!category) category = 'Baut';

  const catCode = catCodeMap[category] || category.substring(0, 3).toUpperCase();

  let itemType = (rawItemType || 'Hex Bolt').trim();
  let itemCode = itemType
    .replace(/\(.*?\)/g, '')
    .trim()
    .toUpperCase()
    .replace(/SOCKET CAP/gi, 'L')
    .replace(/NYLON LOCK NUT/gi, 'NYL-NUT')
    .replace(/SELF TAPPING SCREW/gi, 'SDS')
    .replace(/DRYWALL SCREW/gi, 'DWS')
    .replace(/SPRING WASHER/gi, 'SP-RG')
    .replace(/FLAT WASHER/gi, 'FL-RG')
    .replace(/HEX BOLT/gi, 'HEX')
    .replace(/FLANGE BOLT/gi, 'FLG')
    .replace(/STUD BOLT/gi, 'STB')
    .replace(/HEAVY HEX BOLT/gi, 'HHEX')
    .replace(/CARRIAGE BOLT/gi, 'CRG')
    .replace(/\s+/g, '-');

  let metric = (spec.thread || spec.metric || 'M8').trim();
  let metricCode = metric
    .replace(/"/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();

  let length = (spec.length || '50 mm').trim();
  let lengthCode = length
    .replace(/\s*mm/gi, 'M')
    .replace(/"/gi, 'IN')
    .replace(/\s+/g, '');

  let rawMatGrade = spec.materialGrade || `${spec.material || ''} ${spec.grade || ''}`.trim() || '8.8';
  let gradeCode = '8.8';
  const gradeMatch = rawMatGrade.match(/(12\.9|10\.9|8\.8|4\.8|316|304|A4-80|A2-70|Class 10|Class 8)/i);
  if (gradeMatch) {
    gradeCode = gradeMatch[1].toUpperCase();
  } else {
    gradeCode = rawMatGrade.replace(/\s+/g, '').substring(0, 5).toUpperCase();
  }

  let finishingCode = '';
  if (spec.finishing) {
    const fin = spec.finishing.trim();
    if (/galvaniz|hdg/i.test(fin)) finishingCode = 'HDG';
    else if (/black|oxide/i.test(fin)) finishingCode = 'BLK';
    else if (/yellow/i.test(fin)) finishingCode = 'YZP';
    else if (/polish/i.test(fin)) finishingCode = 'POL';
    else if (/chrome/i.test(fin)) finishingCode = 'CHR';
    else if (/plain|polos/i.test(fin)) finishingCode = 'PLN';
  }

  const parts = [catCode, itemCode, metricCode, lengthCode, gradeCode, finishingCode].filter(Boolean);
  return parts.join('-');
}
