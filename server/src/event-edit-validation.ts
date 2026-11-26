import { timestamp, validateEvent, type EventInput } from './events-validation.js';

export type EditableEvent = EventInput & { version: number; registrationDeadline: Date | null; activeRegistrationCount: number };
export type EventEditResult =
  | { errors: Record<string, string> }
  | { conflict: 'EVENT_CHANGED' | 'EVENT_STARTED' | 'CAPACITY_BELOW_ACTIVE' }
  | { data: EventInput & { registrationDeadline: Date | null }; changed: boolean };

const editableFields = ['title', 'startsAt', 'endsAt', 'location', 'capacity', 'description', 'registrationDeadline'] as const;

// The handler must authorize the owner, hold the schedule/event locks, and
// supply the freshly read state/count and one sampled server decision time.
// This pure rule layer does not acquire locks or perform a database write.
export function validateEventEdit(value: unknown, current: EditableEvent, decisionTime: number): EventEditResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { errors: { form: 'Enter an event edit.' } };
  const body = value as Record<string, unknown>;
  const errors: Record<string, string> = {};
  if (Object.keys(body).some(key => key !== 'expectedVersion' && !editableFields.includes(key as typeof editableFields[number]))) errors.form = 'Unexpected field.';
  if (!editableFields.some(key => Object.hasOwn(body, key))) errors.form = 'Change at least one event field.';
  if (typeof body.expectedVersion !== 'number' || !Number.isSafeInteger(body.expectedVersion) || body.expectedVersion < 0) errors.expectedVersion = 'Reload the event before saving.';
  if (Object.hasOwn(body, 'capacity') && (typeof body.capacity !== 'number' || !Number.isInteger(body.capacity) || body.capacity < 1 || body.capacity > 60)) errors.capacity = 'Capacity must be a whole number from 1 to 60.';
  if (Object.keys(errors).length) return { errors };
  if (body.expectedVersion !== current.version) return { conflict: 'EVENT_CHANGED' };
  if (current.startsAt.getTime() <= decisionTime) return { conflict: 'EVENT_STARTED' };
  const { expectedVersion: _expectedVersion, registrationDeadline: _deadline, ...patch } = body;
  const result = validateEvent({ title: current.title, startsAt: current.startsAt.toISOString(), endsAt: current.endsAt.toISOString(), location: current.location, capacity: current.capacity, description: current.description, ...patch });
  if (!result.data) return { errors: result.errors };
  if (result.data.startsAt.getTime() <= decisionTime) errors.startsAt = 'Start time must be in the future.';
  const registrationDeadline = Object.hasOwn(body, 'registrationDeadline') ? body.registrationDeadline === null ? null : timestamp(body.registrationDeadline) : current.registrationDeadline;
  if (Object.hasOwn(body, 'registrationDeadline') && body.registrationDeadline !== null && !registrationDeadline) errors.registrationDeadline = 'Enter a valid deadline with timezone or leave it empty.';
  else if (registrationDeadline && registrationDeadline > result.data.startsAt) errors.registrationDeadline = 'Deadline must be at or before start time.';
  if (Object.keys(errors).length) return { errors };
  if (result.data.capacity < current.activeRegistrationCount) return { conflict: 'CAPACITY_BELOW_ACTIVE' };
  const data = { ...result.data, registrationDeadline };
  const changed = editableFields.some(key => {
    const before = current[key], after = data[key];
    return (before instanceof Date ? before.getTime() : before) !== (after instanceof Date ? after.getTime() : after);
  });
  return { data, changed };
}
