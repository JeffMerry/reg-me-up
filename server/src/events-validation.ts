export type EventInput = { title: string; startsAt: Date; endsAt: Date; location: string; capacity: number; description: string | null };

export function timestamp(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!m) return null;
  const [year, month, day, hour, minute] = m.slice(1, 6).map(Number); const second = Number(m[6] ?? 0);
  const offset = m[8];
  if (year < 1 || month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59 || second > 59 || (offset !== 'Z' && (Number(offset.slice(1, 3)) > 23 || Number(offset.slice(4, 6)) > 59))) return null;
  const calendar = new Date(0); calendar.setUTCFullYear(year, month - 1, day); calendar.setUTCHours(0, 0, 0, 0);
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function validateEventFields(value: unknown, maximumCapacity: number): { data?: EventInput; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const body = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  if (Object.keys(body).some(key => !['title', 'startsAt', 'endsAt', 'location', 'capacity', 'description'].includes(key))) errors.form = 'Unexpected field.';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const location = typeof body.location === 'string' ? body.location.trim() : '';
  if (!title || [...title].length > 200) errors.title = 'Enter an event name up to 200 characters.';
  if (!location || [...location].length > 300) errors.location = 'Enter a location up to 300 characters.';
  const startsAt = timestamp(body.startsAt); const endsAt = timestamp(body.endsAt);
  if (!startsAt) errors.startsAt = 'Enter a valid start date and time with timezone.';
  if (!endsAt || (startsAt && endsAt <= startsAt)) errors.endsAt = 'End time must be after start time.';
  const capacity = body.capacity;
  if (typeof capacity !== 'number' || !Number.isInteger(capacity) || capacity < 1 || capacity > maximumCapacity) errors.capacity = maximumCapacity === 60 ? 'Enter a whole number from 1 to 60.' : 'Capacity must be a positive whole number.';
  if (body.description !== undefined && body.description !== null && (typeof body.description !== 'string' || [...body.description].length > 10000)) errors.description = 'Description must be at most 10,000 characters.';
  if (Object.keys(errors).length || !startsAt || !endsAt || typeof capacity !== 'number') return { errors };
  const description = typeof body.description === 'string' && body.description.trim() ? body.description : null;
  return { data: { title, startsAt, endsAt, location, capacity, description }, errors };
}

export const validateEvent = (value: unknown) => validateEventFields(value, 60);

// Complete merged edit state may retain an omitted legacy capacity. Explicit
// edit capacity has already been checked against 1–60 by validateEventEdit.
export const validateStoredEvent = (value: unknown) => validateEventFields(value, 2147483647);

export function validatePagination(query: Record<string, unknown>): { page: number; pageSize: number; skip: number } | null {
  if (Object.keys(query).some(key => key !== 'page' && key !== 'pageSize')) return null;
  const parse = (value: unknown, fallback: number) => value === undefined ? fallback : typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : NaN;
  const page = parse(query.page, 1); const pageSize = parse(query.pageSize, 20); const skip = (page - 1) * pageSize;
  return Number.isSafeInteger(page) && Number.isSafeInteger(pageSize) && pageSize <= 100 && Number.isSafeInteger(skip) ? { page, pageSize, skip } : null;
}
