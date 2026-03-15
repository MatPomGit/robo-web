import { describe, expect, it } from 'vitest';
import { buildRosbagCommand } from './rosbagUtils';

const FIXED_DATE = new Date('2026-03-15T10:00:00.000Z');
// ISO → replace : and . → "2026-03-15T10-00-00"
const FIXED_TS = '2026-03-15T10-00-00';

describe('buildRosbagCommand', () => {
  describe('record', () => {
    it('returns "record" when no name and no timestamp', () => {
      expect(buildRosbagCommand('record', '', false, 0, FIXED_DATE)).toBe('record');
    });

    it('uses timestamp as bag name when no explicit name provided', () => {
      expect(buildRosbagCommand('record', '', true, 0, FIXED_DATE)).toBe(
        `record:${FIXED_TS}`,
      );
    });

    it('appends timestamp to explicit name when useTimestamp is true', () => {
      expect(buildRosbagCommand('record', 'my_bag', true, 0, FIXED_DATE)).toBe(
        `record:my_bag_${FIXED_TS}`,
      );
    });

    it('uses explicit name without timestamp when useTimestamp is false', () => {
      expect(buildRosbagCommand('record', 'my_bag', false, 0, FIXED_DATE)).toBe(
        'record:my_bag',
      );
    });

    it('appends :duration when duration > 0', () => {
      expect(buildRosbagCommand('record', 'bag', false, 30, FIXED_DATE)).toBe(
        'record:bag:duration=30',
      );
    });


    it('keeps empty name slot when duration is set without a name', () => {
      expect(buildRosbagCommand('record', '', false, 45, FIXED_DATE)).toBe(
        'record::duration=45',
      );
    });

    it('appends :duration to timestamped name', () => {
      expect(buildRosbagCommand('record', '', true, 60, FIXED_DATE)).toBe(
        `record:${FIXED_TS}:duration=60`,
      );
    });

    it('does NOT append :duration when duration is 0 (infinite)', () => {
      const cmd = buildRosbagCommand('record', 'bag', false, 0, FIXED_DATE);
      expect(cmd).not.toContain(':duration');
    });
  });

  describe('play', () => {
    it('returns "play:<name>" when name is provided', () => {
      expect(buildRosbagCommand('play', 'my_bag', false, 0, FIXED_DATE)).toBe(
        'play:my_bag',
      );
    });

    it('returns plain "play" when name is empty', () => {
      expect(buildRosbagCommand('play', '', false, 0, FIXED_DATE)).toBe('play');
    });
  });

  describe('stop', () => {
    it('always returns "stop" regardless of name/duration', () => {
      expect(buildRosbagCommand('stop', 'bag', true, 30, FIXED_DATE)).toBe('stop');
    });
  });

  describe('pause', () => {
    it('always returns "pause" regardless of name/duration', () => {
      expect(buildRosbagCommand('pause', 'bag', true, 30, FIXED_DATE)).toBe('pause');
    });
  });
});
