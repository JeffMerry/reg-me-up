import { describe, expect, it } from 'vitest';
import { hasEmptyRegistrationBody, validateOwnRegistrationQuery, validateRegistrationId } from '../../src/registrations-validation.js';

const eventId = '123e4567-e89b-42d3-a456-426614174000';

describe('F-03 registration input validation', () => {
  it('accepts UUID registration references and rejects malformed values', () => {
    expect(validateRegistrationId(eventId)).toBe(eventId);
    for (const value of [undefined, null, '', 'not-a-uuid', `${eventId}x`, 42, ['123e4567-e89b-42d3-a456-426614174000']]) {
      expect(validateRegistrationId(value)).toBeNull();
    }
  });

  it('applies own-list defaults and accepts a valid event filter', () => {
    expect(validateOwnRegistrationQuery({})).toEqual({ page: 1, pageSize: 20, skip: 0, eventId: undefined });
    expect(validateOwnRegistrationQuery({ page: '2', pageSize: '10', eventId })).toEqual({ page: 2, pageSize: 10, skip: 10, eventId });
  });

  it.each([
    { page: '0' }, { page: '-1' }, { page: '1.5' }, { page: '01' }, { page: '1e2' },
    { pageSize: '0' }, { pageSize: '101' }, { pageSize: '2.0' }, { pageSize: ['20'] },
    { page: '9007199254740991', pageSize: '100' }, { eventId: 'bad' }, { participantId: eventId },
  ])('rejects unsupported or invalid own-list query %#', query => {
    expect(validateOwnRegistrationQuery(query)).toBeNull();
  });

  it('accepts only an empty JSON object for registration creation', () => {
    expect(hasEmptyRegistrationBody({})).toBe(true);
    for (const body of [null, undefined, [], { participantId: eventId }, { role: 'PARTICIPANT' }, '']) {
      expect(hasEmptyRegistrationBody(body)).toBe(false);
    }
  });
});
