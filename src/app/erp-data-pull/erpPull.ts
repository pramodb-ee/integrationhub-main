export type Row = Record<string, unknown>;
export type Mapping = { id: string; source: string; target: string };
export const CRM_FIELDS = [
  'LeadName',
  'MobileNumber',
  'Email',
  'Course',
  'RecordOnDateTime',
  'City',
  'Source',
  'Remarks',
];
export const INITIAL_MAPPINGS: Mapping[] = [
  'student_name',
  'mobile',
  'email',
  'course_name',
  'created_on',
].map((source, i) => ({ id: `mapping-${i}`, source, target: CRM_FIELDS[i] }));
export const SAMPLE: Row[] = [
  {
    student_name: 'Jagan Behera',
    mobile: '8327742041',
    email: 'jagan@example.com',
    course_name: 'Commerce',
    created_on: '2026-09-11T09:30:00Z',
  },
  {
    student_name: 'Ananya Gupta',
    mobile: '9812345670',
    email: 'ananya@example.com',
    course_name: 'MBA',
    created_on: '2026-09-11T10:00:00Z',
  },
];
export function mappingErrors(rows: Mapping[]) {
  const errors: string[] = [];
  if (rows.some((r) => !r.source.trim() || !r.target))
    errors.push('Complete the ERP and CRM fields for every mapping.');
  if (new Set(rows.map((r) => r.target)).size !== rows.length)
    errors.push('Each CRM field must have only one mapping.');
  for (const target of ['LeadName', 'MobileNumber'])
    if (!rows.some((r) => r.target === target)) errors.push(`${target} mapping is required.`);
  return errors;
}
export function parseRecords(text: string): Row[] {
  const input: unknown = JSON.parse(text);
  const value = Array.isArray(input)
    ? input
    : input && typeof input === 'object' && 'data' in input
      ? input.data
      : [input];
  if (!Array.isArray(value) || value.some((r) => !r || typeof r !== 'object' || Array.isArray(r)))
    throw new Error(
      'ERP response must contain an object, an array of objects, or { data: [...] }.'
    );
  return value as Row[];
}
export function transform(record: Row, mappings: Mapping[]) {
  const crm = Object.fromEntries(mappings.map((m) => [m.target, record[m.source] ?? null]));
  const errors = mappingErrors(mappings);
  if (!String(crm.LeadName ?? '').trim()) errors.push('LeadName is required.');
  if (
    !/^\+?[\d ()-]+$/.test(String(crm.MobileNumber ?? '')) ||
    !/^\d{10,15}$/.test(String(crm.MobileNumber ?? '').replace(/\D/g, ''))
  )
    errors.push('MobileNumber is invalid.');
  if (crm.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(crm.Email)))
    errors.push('Email is invalid.');
  if (crm.RecordOnDateTime && Number.isNaN(Date.parse(String(crm.RecordOnDateTime))))
    errors.push('RecordOnDateTime is invalid.');
  return { crm, error: errors.join(' ') };
}
