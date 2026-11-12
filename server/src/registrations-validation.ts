const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateRegistrationId(value: unknown): string | null {
  return typeof value === 'string' && uuid.test(value) ? value : null;
}

export function validateOwnRegistrationQuery(query: Record<string, unknown>) {
  const allowed = new Set(['page', 'pageSize', 'eventId']);
  if (Object.keys(query).some(key => !allowed.has(key))) return null;
  const page = query.page === undefined ? 1 : Number(query.page);
  const pageSize = query.pageSize === undefined ? 20 : Number(query.pageSize);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) return null;
  if ((query.page !== undefined && String(page) !== query.page) || (query.pageSize !== undefined && String(pageSize) !== query.pageSize)) return null;
  const eventId = query.eventId === undefined ? undefined : validateRegistrationId(query.eventId);
  if (query.eventId !== undefined && !eventId) return null;
  const skip = (page - 1) * pageSize;
  if (!Number.isSafeInteger(skip)) return null;
  return { page, pageSize, skip, eventId };
}

export function hasEmptyRegistrationBody(body: unknown): boolean {
  return !!body && typeof body === 'object' && !Array.isArray(body) && Object.keys(body).length === 0;
}
