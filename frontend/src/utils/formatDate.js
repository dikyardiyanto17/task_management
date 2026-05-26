/** Resolve Sequelize/API date fields (createdAt vs created_at). */
export function getDateValue(record, field = 'created') {
  if (!record) return null;
  return (
    record[`${field}_at`] ??
    record[`${field}At`] ??
    record[field] ??
    null
  );
}

export function formatDateTime(record, field = 'created') {
  const value = getDateValue(record, field);
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}
