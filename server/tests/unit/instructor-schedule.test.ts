import { describe, expect, it } from 'vitest';
import { overlapsHalfOpenInterval } from '../../src/instructor-schedule.js';

const time = (value: string) => new Date(`2030-01-15T${value}${value.length === 5 ? ':00' : ''}Z`);

describe('half-open Instructor schedule intervals', () => {
  it.each([
    ['equal ranges overlap', '10:00', '11:00', '10:00', '11:00', true],
    ['candidate contained by existing', '10:15', '10:45', '10:00', '11:00', true],
    ['existing contained by candidate', '10:00', '11:00', '10:15', '10:45', true],
    ['adjacent ranges are allowed', '10:00', '11:00', '11:00', '12:00', false],
    ['one millisecond overlap', '10:59:59.999', '12:00', '10:00', '11:00', true],
    ['separate ranges do not overlap', '12:00', '13:00', '10:00', '11:00', false],
  ])('%s', (_name, candidateStart, candidateEnd, otherStart, otherEnd, expected) => {
    expect(overlapsHalfOpenInterval(
      { startsAt: time(candidateStart), endsAt: time(candidateEnd) },
      { startsAt: time(otherStart), endsAt: time(otherEnd) },
    )).toBe(expected);
  });
});
