import { validateEvent, type EventInput } from './events-validation.js';

export type EditableEvent = EventInput & { version: number; registrationDeadline: Date | null; activeRegistrationCount: number };
export type EventEditResult =
  | { errors: Record<string, string> }
  | { conflict: 'EVENT_CHANGED' | 'EVENT_STARTED' | 'CAPACITY_BELOW_ACTIVE' }
  | { data: EventInput & { registrationDeadline: Date | null }; changed: boolean };

// Test-first scaffold: reuse publication validation for the merged event. The
// edit-specific rules are introduced only after a meaningful RED is recorded.
export function validateEventEdit(value: unknown, current: EditableEvent, _decisionTime: number): EventEditResult {
  const body = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const { expectedVersion: _expectedVersion, registrationDeadline: _deadline, ...patch } = body;
  const result = validateEvent({ title: current.title, startsAt: current.startsAt.toISOString(), endsAt: current.endsAt.toISOString(), location: current.location, capacity: current.capacity, description: current.description, ...patch });
  if (!result.data) return { errors: result.errors };
  return { data: { ...result.data, registrationDeadline: current.registrationDeadline }, changed: true };
}
