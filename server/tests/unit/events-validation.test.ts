import { describe, expect, it } from 'vitest';
import { validateEvent, validatePagination } from '../../src/events-validation.js';

const good = { title: '  Workshop  ', startsAt: '2026-12-01T09:00:00+07:00', endsAt: '2026-12-01T11:00:00+07:00', location: ' Room A ', capacity: 3 };

describe('F-02 publication validation', () => {
  it('normalizes required text and optional description, preserving offset instants', () => {
    const value = validateEvent(good);
    expect(value.errors).toEqual({});
    expect(value.data).toMatchObject({ title: 'Workshop', location: 'Room A', capacity: 3, description: null });
    expect(value.data?.startsAt.toISOString()).toBe('2026-12-01T02:00:00.000Z');
    expect(validateEvent({ ...good, startsAt: '2026-12-01T09:00+07:00' }).data?.startsAt.toISOString()).toBe('2026-12-01T02:00:00.000Z');
    expect(validateEvent({ ...good, description: '  ' }).data?.description).toBeNull();
    expect(validateEvent({ ...good, description: '  Details  ' }).data?.description).toBe('  Details  ');
  });
  it.each(['title', 'startsAt', 'endsAt', 'location', 'capacity'])('rejects missing %s', field => {
    const input: Record<string, unknown> = { ...good }; delete input[field];
    expect(validateEvent(input).errors[field]).toBeTruthy();
  });
  it.each([0, -1, 1.5, '3', 2147483648, null])('rejects invalid capacity %s', capacity => {
    expect(validateEvent({ ...good, capacity }).errors.capacity).toBeTruthy();
  });
  it.each(['2026-02-30T09:00:00+07:00', '2026-12-01T09:00:00', '2026-13-01T09:00:00Z'])('rejects invalid timestamp %s', startsAt => {
    expect(validateEvent({ ...good, startsAt }).errors.startsAt).toBeTruthy();
  });
  it('rejects equal or reversed dates, spoofed fields and text beyond Unicode limits', () => {
    expect(validateEvent({ ...good, endsAt: good.startsAt }).errors.endsAt).toBeTruthy();
    expect(validateEvent({ ...good, organizerId: 'other' }).errors.form).toBeTruthy();
    expect(validateEvent({ ...good, title: '😀'.repeat(200) }).errors.title).toBeUndefined();
    expect(validateEvent({ ...good, title: '😀'.repeat(201) }).errors.title).toBeTruthy();
    expect(validateEvent({ ...good, description: 'x'.repeat(10001) }).errors.description).toBeTruthy();
  });
  it('accepts exact limits, optional null description and past or overnight offset dates', () => {
    const result = validateEvent({ ...good, title: 't'.repeat(200), location: '😀'.repeat(300), description: 'x'.repeat(10000), capacity: 2147483647, startsAt: '2020-12-31T23:30:00+07:00', endsAt: '2021-01-01T01:00:00+07:00' });
    expect(result.errors).toEqual({});
    expect(result.data?.startsAt.toISOString()).toBe('2020-12-31T16:30:00.000Z');
    expect(result.data?.endsAt.toISOString()).toBe('2020-12-31T18:00:00.000Z');
    expect(validateEvent({ ...good, description: null }).data?.description).toBeNull();
  });
  it('rejects blank or overlong location/title and non-text description', () => {
    expect(validateEvent({ ...good, title: '  ' }).errors.title).toBeTruthy();
    expect(validateEvent({ ...good, location: '  ' }).errors.location).toBeTruthy();
    expect(validateEvent({ ...good, location: '😀'.repeat(301) }).errors.location).toBeTruthy();
    expect(validateEvent({ ...good, description: 123 }).errors.description).toBeTruthy();
    expect(validateEvent({ ...good, endsAt: '2026-11-30T09:00:00+07:00' }).errors.endsAt).toBeTruthy();
  });
});

describe('F-02 pagination validation', () => {
  it('uses defaults, accepts bounded pageSize and rejects unsupported inputs', () => {
    expect(validatePagination({})).toEqual({ page: 1, pageSize: 20, skip: 0 });
    expect(validatePagination({ page: '2', pageSize: '100' })).toEqual({ page: 2, pageSize: 100, skip: 100 });
    for (const query of [{ page: '0' }, { pageSize: '101' }, { page: '1.5' }, { page: '9007199254740991', pageSize: '100' }, { organizerId: 'x' }]) expect(validatePagination(query)).toBeNull();
  });
});
