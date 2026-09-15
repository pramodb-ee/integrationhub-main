import * as XLSX from 'xlsx';

export interface DefaultValueRow {
  fieldName: string;
  defaultValue: string;
}

const REQUIRED_HEADERS = ['Field Name', 'Default Value'] as const;

export function downloadDefaultValuesTemplate() {
  const worksheet = XLSX.utils.aoa_to_sheet([
    [...REQUIRED_HEADERS],
    ['Example Field', 'Example Value'],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Default Values');
  XLSX.writeFile(workbook, 'default-values-template.xlsx');
}

export function parseDefaultValuesWorkbook(file: File): Promise<DefaultValueRow[]> {
  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) throw new Error('The workbook does not contain a worksheet.');

    const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: '' });
    const headers = rows[0] || [];
    const normalizedHeaders = headers.map((header) => String(header).trim().toLowerCase());
    const fieldNameIndex = normalizedHeaders.indexOf('field name');
    const defaultValueIndex = normalizedHeaders.indexOf('default value');
    if (fieldNameIndex === -1 || defaultValueIndex === -1) {
      throw new Error('The template must contain Field Name and Default Value columns.');
    }

    return rows.slice(1)
      .map((row) => ({
        fieldName: String(row[fieldNameIndex] ?? '').trim(),
        defaultValue: String(row[defaultValueIndex] ?? '').trim(),
      }))
      .filter((row) => row.fieldName.length > 0);
  });
}
