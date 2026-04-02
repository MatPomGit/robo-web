/**
 * TypeScript interfaces for ROS message types used in the app.
 * These map to standard ROS2 message definitions.
 */

/** sensor_msgs/BatteryState */
export interface BatteryState {
  percentage: number;
  voltage?: number;
  current?: number;
  temperature?: number;
}

/** sensor_msgs/JointState */
export interface JointState {
  name: string[];
  position: number[];
  velocity?: number[];
  effort?: number[];
}

/** sensor_msgs/LaserScan */
export interface LaserScan {
  angle_min: number;
  angle_max: number;
  angle_increment: number;
  time_increment?: number;
  scan_time?: number;
  range_min: number;
  range_max: number;
  ranges: number[];
  intensities?: number[];
}

/** sensor_msgs/PointCloud2 */
export interface PointCloud2 {
  data?: string;
  width?: number;
  height?: number;
}

/** sensor_msgs/CompressedImage */
export interface CompressedImage {
  format?: string;
  data?: string;
}

/** Quaternion from geometry_msgs */
export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

/** Point from geometry_msgs */
export interface Point {
  x: number;
  y: number;
  z: number;
}

/** Pose from geometry_msgs */
export interface Pose {
  position: Point;
  orientation: Quaternion;
}

/** PoseWithCovariance from geometry_msgs */
export interface PoseWithCovariance {
  pose: Pose;
  covariance?: number[];
}

/** nav_msgs/Odometry */
export interface Odometry {
  pose: PoseWithCovariance;
}

/** rcl_interfaces/msg/Log */
export interface RosLog {
  level?: number;
  name?: string;
  msg: string;
  file?: string;
  function?: string;
  line?: number;
}

/** std_msgs/String */
export interface StdString {
  data: string;
}

/** std_msgs/Float64 */
export interface StdFloat64 {
  data: number;
}

/** geometry_msgs/Twist */
export interface Twist {
  linear: { x: number; y: number; z: number };
  angular: { x: number; y: number; z: number };
}
