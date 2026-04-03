/**
 * Application-wide named constants — replaces magic numbers throughout the codebase.
 */

/** Maximum number of log entries kept in the system log panel. */
export const LOG_HISTORY_SIZE = 50;

/** Maximum number of positions kept in the robot trajectory history. */
export const TRAJECTORY_HISTORY_SIZE = 200;

/** Demo-mode simulation tick interval in milliseconds. */
export const SIMULATION_TICK_MS = 100;

/** Number of simulation ticks before the battery drains by 1% (~30 seconds at SIMULATION_TICK_MS). */
export const BATTERY_DRAIN_TICKS = 300;

/** Footstep size in meters used when planning a footstep sequence. */
export const FOOTSTEP_SIZE_M = 0.3;

/** Minimum distance (in meters) between trajectory waypoints before a new one is recorded. */
export const MOVEMENT_THRESHOLD_M = 0.1;

/** Maximum random noise added to simulated lidar ranges in demo mode (meters). */
export const MAX_LIDAR_NOISE_M = 0.8;

/** Maximum allowed rosbag recording duration in seconds. */
export const ROSBAG_MAX_DURATION_S = 3600;

/** Number of data points retained in each joint sparkline history. */
export const JOINT_HISTORY_SIZE = 30;

/** Duration (in milliseconds) before a notification is automatically dismissed. */
export const NOTIFICATION_TTL_MS = 5000;

/** Maximum number of notifications shown simultaneously. */
export const NOTIFICATION_MAX = 5;

/** Maximum number of captured images retained in the gallery. */
export const CAPTURED_IMAGES_MAX = 10;

/** Simulated camera capture delay in milliseconds. */
export const CAMERA_CAPTURE_DELAY_MS = 800;

/** Copy-to-clipboard success indicator display duration in milliseconds. */
export const COPY_STATUS_TTL_MS = 2000;

/** Unique ID character range used when generating random IDs (substring start). */
export const ID_SUBSTR_START = 2;

/** Unique ID character range used when generating random IDs (substring end). */
export const ID_SUBSTR_END = 9;

/** Simulated footstep planning delay in milliseconds. */
export const FOOTSTEP_PLAN_DELAY_MS = 1200;

/** Simulated task execution time per task in milliseconds. */
export const TASK_EXECUTION_MS = 2000;

/** Simulated footstep execution time per step in milliseconds. */
export const FOOTSTEP_EXECUTION_MS = 800;

/** Playback progress update interval in milliseconds. */
export const PLAYBACK_INTERVAL_MS = 1000;

/** Demo topic discovery delay in milliseconds. */
export const DEMO_DISCOVERY_DELAY_MS = 600;
