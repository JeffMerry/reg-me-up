import { describe, expect, it } from 'vitest';
import { validateEventEdit, type EditableEvent } from '../../src/event-edit-validation.js';

const start = Date.parse('2030-01-15T02:00:00Z');
const now = start - 3_600_000;
const fixture = (overrides: Partial<EditableEvent> = {}): EditableEvent => ({ title: 'Workshop', startsAt: new Date(start), endsAt: new Date(start + 3_600_000), location: 'Room A', capacity: 100, description: 'Details', registrationDeadline: null, version: 3, activeRegistrationCount: 2, ...overrides });
const edit = (body: unknown, state = fixture(), time = now) => validateEventEdit(body, state, time);

describe('F-06 locked event edit rules', () => {
  it('rejects explicitly supplied capacity 61 while preserving omitted legacy capacity', () => {
    expect(edit({ expectedVersion: 3, capacity: 61 })).toEqual({ errors: { capacity: 'Capacity must be a whole number from 1 to 60.' } });
    expect(edit({ expectedVersion: 3, title: 'Updated' })).toMatchObject({ data: { title: 'Updated', capacity: 100 }, changed: true });
  });
  it.each([1, 60])('accepts explicit capacity boundary %s when ACTIVE count permits', capacity => {
    expect(edit({ expectedVersion: 3, capacity }, fixture({ activeRegistrationCount: 0 }))).toMatchObject({ data: { capacity }, changed: true });
  });
  it.each([0, -1, 1.5, '60', null, true, 2147483648])('rejects invalid explicit capacity %s', capacity => {
    expect(edit({ expectedVersion: 3, capacity })).toHaveProperty('errors.capacity');
  });
  it('permits equal ACTIVE capacity and rejects a reduction below ACTIVE', () => {
    expect(edit({ expectedVersion: 3, capacity: 2 })).toMatchObject({ data: { capacity: 2 } });
    expect(edit({ expectedVersion: 3, capacity: 1 })).toEqual({ conflict: 'CAPACITY_BELOW_ACTIVE' });
    expect(edit({ expectedVersion: 3, title: 'Legacy' }, fixture({ activeRegistrationCount: 70 }))).toMatchObject({ data: { capacity: 100 } });
    expect(edit({ expectedVersion: 3, capacity: 60 }, fixture({ activeRegistrationCount: 70 }))).toEqual({ conflict: 'CAPACITY_BELOW_ACTIVE' });
  });
  it('preserves omissions and permits explicit null only for nullable fields', () => {
    const state = fixture({ registrationDeadline: new Date(start - 1000) });
    expect(edit({ expectedVersion: 3, location: ' Room B ' }, state)).toMatchObject({ data: { title: 'Workshop', location: 'Room B', description: 'Details', registrationDeadline: state.registrationDeadline, startsAt: state.startsAt } });
    expect(edit({ expectedVersion: 3, description: null, registrationDeadline: null }, state)).toMatchObject({ data: { description: null, registrationDeadline: null } });
    for (const field of ['title', 'location', 'startsAt', 'endsAt']) expect(edit({ expectedVersion: 3, [field]: null })).toHaveProperty(`errors.${field}`);
  });
  it('validates the resulting time range including an omitted existing deadline', () => {
    expect(edit({ expectedVersion: 3, startsAt: '2030-01-15T04:00:00Z' })).toHaveProperty('errors.endsAt');
    const state = fixture({ registrationDeadline: new Date(start - 1000) });
    expect(edit({ expectedVersion: 3, startsAt: new Date(start - 2000).toISOString() }, state)).toHaveProperty('errors.registrationDeadline');
  });
  it('accepts a past deadline and an equal-to-start deadline, preserving timezone instants', () => {
    for (const registrationDeadline of ['2030-01-15T00:00:00Z', '2030-01-15T09:00:00+07:00']) {
      const result = edit({ expectedVersion: 3, registrationDeadline });
      expect(result).toMatchObject({ data: { registrationDeadline: new Date(registrationDeadline) } });
    }
    expect(edit({ expectedVersion: 3, registrationDeadline: '2030-01-15T02:00:00.001Z' })).toHaveProperty('errors.registrationDeadline');
  });
  it.each(['2030-02-30T02:00:00Z', '2030-01-15T02:00:00', '', 42, true])('rejects malformed deadline %s', registrationDeadline => {
    expect(edit({ expectedVersion: 3, registrationDeadline })).toHaveProperty('errors.registrationDeadline');
  });
  it('validates expectedVersion and refuses forged fields or an empty edit', () => {
    for (const expectedVersion of [undefined, null, -1, 1.5, '3', true, Number.MAX_SAFE_INTEGER + 1]) expect(edit({ expectedVersion, title: 'Updated' })).toHaveProperty('errors.expectedVersion');
    for (const key of ['organizerId', 'publicationStatus', 'version', 'id', 'currentInstructor']) expect(edit({ expectedVersion: 3, [key]: 'forged', title: 'Updated' })).toHaveProperty('errors.form');
    for (const value of [null, [], 'text', {}, { expectedVersion: 3 }]) expect(edit(value)).toHaveProperty('errors');
  });
  it('rejects stale versions before checking the start boundary, including no-op edits', () => {
    expect(edit({ expectedVersion: 2, title: 'Workshop' }, fixture(), start)).toEqual({ conflict: 'EVENT_CHANGED' });
    for (const time of [start, start + 1]) expect(edit({ expectedVersion: 3, title: 'Workshop' }, fixture(), time)).toEqual({ conflict: 'EVENT_STARTED' });
    expect(edit({ expectedVersion: 3, title: 'Updated' }, fixture(), start - 1)).toMatchObject({ data: { title: 'Updated' } });
  });
  it('requires proposed start strictly after the locked decision time', () => {
    for (const time of [now - 1, now]) expect(edit({ expectedVersion: 3, startsAt: new Date(time).toISOString() })).toHaveProperty('errors.startsAt');
    expect(edit({ expectedVersion: 3, startsAt: new Date(now + 1).toISOString() })).toHaveProperty('data');
  });
  it('identifies normalized no-op edits without mutating the locked snapshot', () => {
    const state = fixture(); const snapshot = structuredClone(state);
    expect(edit({ expectedVersion: 3, title: ' Workshop ', startsAt: '2030-01-15T09:00:00+07:00', registrationDeadline: null }, state)).toMatchObject({ changed: false });
    expect(edit({ expectedVersion: 3, description: '  ' }, state)).toMatchObject({ data: { description: null }, changed: true });
    expect(state).toEqual(snapshot);
  });
  it('retains existing Unicode/text limits on edits', () => {
    expect(edit({ expectedVersion: 3, title: '😀'.repeat(200), location: '😀'.repeat(300), description: 'x'.repeat(10000) })).toHaveProperty('data');
    for (const [key, value] of [['title', '😀'.repeat(201)], ['location', '😀'.repeat(301)], ['description', 'x'.repeat(10001)], ['title', '  '], ['location', 12]]) expect(edit({ expectedVersion: 3, [key]: value })).toHaveProperty(`errors.${key}`);
  });
});
