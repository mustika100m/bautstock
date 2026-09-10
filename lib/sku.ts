export interface ProductSpecInput {
  category?: string;
  itemType?: string;
  metric?: string;
  length?: string;
  material?: string;
  grade?: string;
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

  const category = (spec.category || 'Baut').trim();
  const catCode = catCodeMap[category] || category.substring(0, 3).toUpperCase();

  // Clean itemType for shortcode
  let itemType = (spec.itemType || 'Hex Bolt').trim();
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

  // Metric handling (e.g. M8, 1/4" UNC, 1/2" UNF)
  let metric = (spec.metric || 'M8').trim();
  let metricCode = metric
    .replace(/"/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();

  // Length handling (e.g. 50 mm -> 50M, 2" -> 2IN, 1-1/2" -> 1.5IN)
  let length = (spec.length || '50 mm').trim();
  let lengthCode = length
    .replace(/\s*mm/gi, 'M')
    .replace(/"/gi, 'IN')
    .replace(/\s+/g, '');

  // Grade handling
  let grade = (spec.grade || '8.8').trim();
  let gradeCode = grade
    .replace(/\s+/g, '')
    .replace(/StainlessSteel/gi, 'SS')
    .toUpperCase();

  const parts = [catCode, itemCode, metricCode, lengthCode, gradeCode].filter(Boolean);
  return parts.join('-');
}
