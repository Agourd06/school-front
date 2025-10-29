export function validateRequired(value: string | number | null | undefined, fieldLabel = 'This field') {
  const isEmpty = value === null || value === undefined || (typeof value === 'string' && value.trim() === '') || value === 0 && fieldLabel.toLowerCase().includes('select');
  return isEmpty ? `${fieldLabel} is required` : '';
}

export function validatePositiveNumber(value: string | number | undefined, fieldLabel = 'Value') {
  if (value === undefined || value === '') return '';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num) || num < 0) return `${fieldLabel} must be a positive number`;
  return '';
}

export function validateDateOrder(start?: string, end?: string, labels: { start?: string; end?: string } = {}) {
  if (!start || !end) return '';
  const s = Date.parse(start);
  const e = Date.parse(end);
  if (Number.isNaN(s) || Number.isNaN(e)) return 'Invalid date format';
  if (e <= s) return `${labels.end ?? 'End date'} must be greater than ${labels.start ?? 'start date'}`;
  return '';
}

export function validateSelectRequired(value: number | '' | undefined, fieldLabel = 'Selection') {
  return value === '' || value === undefined ? `${fieldLabel} is required` : '';
}


