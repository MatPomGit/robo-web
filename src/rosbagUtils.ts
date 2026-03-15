/**
 * Builds the command string sent to the /rosbag_cmd topic.
 *
 * @param action   - rosbag action to perform
 * @param name     - bag name (already trimmed); empty string means no name
 * @param useTimestamp - whether to append an ISO timestamp to the bag name
 * @param duration - recording duration in seconds; 0 means infinite
 * @param now      - optional Date used instead of `new Date()` (useful in tests)
 * @returns        command string, e.g. `"record:my_bag_2026-03-15T10-00-00:duration=30"`
 */
export function buildRosbagCommand(
  action: 'record' | 'play' | 'stop' | 'pause',
  name: string,
  useTimestamp: boolean,
  duration: number,
  now: Date = new Date(),
): string {
  let cmdData: string = action;
  let finalName = name;

  if (action === 'record') {
    if (useTimestamp) {
      const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      finalName = finalName ? `${finalName}_${ts}` : ts;
    }
    if (finalName) cmdData = `${action}:${finalName}`;
    if (duration > 0) cmdData += `:duration=${duration}`;
  } else if (action === 'play' && finalName) {
    cmdData = `${action}:${finalName}`;
  }

  return cmdData;
}
