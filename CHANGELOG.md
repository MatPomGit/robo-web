# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] – 2026-03-14

### Added
- Initial public release of **Unitree G1 EDU Controller** HMI.
- React 19 + TypeScript + Vite 6 frontend with Tailwind CSS 4 styling.
- Real-time connection to ROS2 bridge via WebSocket (`roslib`).
- Telemetry dashboard: battery level, joint states with sparkline history, ROS log viewer, notification centre.
- Teleoperacja panel: keyboard and on-screen button controls, linear/angular velocity adjustment, instant STOP and E-STOP commands.
- Three visual modes: Camera (RGB/Depth stream), 3D Robot Model (`@react-three/fiber`), SLAM Map/LiDAR point-cloud (`d3`).
- ROS Topic Explorer: automatic topic discovery, dynamic subscriptions, JSON payload viewer with syntax highlighting, clipboard copy.
- Rosbag2 control panel: record with optional name/timestamp/duration, play/pause/stop/seek.
- Task Queue panel (demonstrative): sequential arm/grasp/move task execution.
- Footstep Planning panel (demonstrative): target pose input and simulated footstep generation.
- Layout presets: Default, Manual, Autonomous.
- `setup.sh` plug-and-play setup script – checks Node.js version, installs dependencies and optionally builds the project.
- GitHub Actions CI workflow: TypeScript lint + Vite build on every push and pull request.
- GitHub Actions Release workflow: automated build, ZIP archive and GitHub Release creation on version tag push (`v*.*.*`).
- `CHANGELOG.md` following Keep-a-Changelog format.

### Changed
- Package name updated from `react-example` to `unitree-g1-controller`.
- Package version bumped from `0.0.0` to `1.0.0`.

### Security
- All safety-critical limitations documented in `README.md` and `docs/unitree-g1-connection-analysis.md`.
- No secrets or credentials are shipped with the repository; `.env` is generated locally from `.env.example`.
