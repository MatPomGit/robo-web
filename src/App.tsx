import React, { useState, useEffect, useCallback } from 'react';
import { 
  Battery, Wifi, Activity, Power, Settings, Video, 
  Gamepad2, Cpu, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  RotateCcw, RotateCw, AlertTriangle, ShieldAlert, Link, Link2Off,
  Circle, Square, Play, Info, LayoutDashboard, Octagon, Database,
  ListChecks, Footprints, Camera, Layout, Maximize2, Monitor, Save, Trash2, ChevronRight, ChevronUp, ChevronDown,
  Target, Navigation, Share2, Box, Copy, Check
} from 'lucide-react';
import * as ROSLIB from 'roslib';
import { Robot3D } from './components/Robot3D';
import { LidarMap } from './components/LidarMap';
import { Sparkline } from './components/Sparkline';

export default function App() {
  const [rosStatus, setRosStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [rosErrorMsg, setRosErrorMsg] = useState<string>('');
  const [rosUrl, setRosUrl] = useState('ws://localhost:9090');
  const [ros, setRos] = useState<ROSLIB.Ros | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'topics' | 'instructions'>('dashboard');
  const [rosbagStatus, setRosbagStatus] = useState<'idle' | 'recording' | 'playing' | 'paused'>('idle');
  const [rosbagProgress, setRosbagProgress] = useState(0);
  const [rosbagName, setRosbagName] = useState('');
  const [rosbagDuration, setRosbagDuration] = useState<number>(0); // 0 = infinite
  const [rosbagUseTimestamp, setRosbagUseTimestamp] = useState(true);
  const [rosbagConfirmAction, setRosbagConfirmAction] = useState<'play' | 'stop' | null>(null);
  const [rosConfirmAction, setRosConfirmAction] = useState<'connect' | 'disconnect' | null>(null);
  const [expandedJoints, setExpandedJoints] = useState<Record<string, boolean>>({});
  
  const [customTopics, setCustomTopics] = useState<{name: string, type: string}[]>([]);
  const [customTopicData, setCustomTopicData] = useState<Record<string, any>>({});
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});
  const [customTopicName, setCustomTopicName] = useState('');
  const [customTopicType, setCustomTopicType] = useState('');
  const [discoveredTopics, setDiscoveredTopics] = useState<{name: string, type: string}[]>([]);
  const [topicSearch, setTopicSearch] = useState('');
  const [subscribedTopicSearch, setSubscribedTopicSearch] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [layout, setLayout] = useState<'default' | 'manual' | 'autonomous'>('default');
  
  // Task Execution System
  const [tasks, setTasks] = useState<{ id: string, type: 'move_arm' | 'grasp' | 'move_to', params: any }[]>([]);
  const [isTaskExecuting, setIsTaskExecuting] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(-1);

  // Footstep Planning
  const [targetPose, setTargetPose] = useState({ x: 0, y: 0, yaw: 0 });
  const [footsteps, setFootsteps] = useState<{ x: number, y: number, side: 'left' | 'right' }[]>([]);
  const [isPlanningFootsteps, setIsPlanningFootsteps] = useState(false);

  const [viewMode, setViewMode] = useState<'camera' | '3d' | 'map'>('camera');
  const [cameraMode, setCameraMode] = useState<'rgb' | 'depth'>('rgb');
  const [lidarPoints, setLidarPoints] = useState<number[][]>([]);
  const [robotPose, setRobotPose] = useState({ x: 0, y: 0, yaw: 0 });
  const [trajectory, setTrajectory] = useState<{ x: number, y: number }[]>([]);
  const [notifications, setNotifications] = useState<{ id: string, type: 'info' | 'warning' | 'error', message: string, timestamp: Date }[]>([]);
  
  const [battery, setBattery] = useState(87);
  const [isRecordingImage, setIsRecordingImage] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [mode, setMode] = useState('Standby');
  const [pendingMode, setPendingMode] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([
    '[10:42:01] System initialized.',
    '[10:42:05] Waiting for ROS2 Bridge connection...',
  ]);

  const [joints, setJoints] = useState<Record<string, { 
    pos: string, 
    torque: string, 
    temp: string, 
    status: 'normal'|'warning'|'error',
    posHistory: number[],
    torqueHistory: number[]
  }>>({
    'L_HIP_PITCH': { pos: '12.4°', torque: '2.1 Nm', temp: '38°C', status: 'normal', posHistory: [], torqueHistory: [] },
    'L_HIP_ROLL': { pos: '-1.2°', torque: '0.5 Nm', temp: '37°C', status: 'normal', posHistory: [], torqueHistory: [] },
    'L_KNEE': { pos: '-24.1°', torque: '4.5 Nm', temp: '42°C', status: 'warning', posHistory: [], torqueHistory: [] },
    'L_ANKLE_PITCH': { pos: '11.2°', torque: '1.8 Nm', temp: '36°C', status: 'normal', posHistory: [], torqueHistory: [] },
    'R_HIP_PITCH': { pos: '12.3°', torque: '2.0 Nm', temp: '37°C', status: 'normal', posHistory: [], torqueHistory: [] },
    'R_HIP_ROLL': { pos: '1.1°', torque: '0.6 Nm', temp: '36°C', status: 'normal', posHistory: [], torqueHistory: [] },
    'R_KNEE': { pos: '-24.0°', torque: '4.4 Nm', temp: '39°C', status: 'normal', posHistory: [], torqueHistory: [] },
    'R_ANKLE_PITCH': { pos: '11.1°', torque: '1.9 Nm', temp: '36°C', status: 'normal', posHistory: [], torqueHistory: [] },
    'TORSO_YAW': { pos: '0.0°', torque: '0.1 Nm', temp: '35°C', status: 'normal', posHistory: [], torqueHistory: [] },
  });

  const addLog = useCallback((msg: string) => {
    setLogs(prev => {
      const newLogs = [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev];
      return newLogs.slice(0, 50);
    });
  }, []);

  const addNotification = useCallback((type: 'info' | 'warning' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [{ id, type, message, timestamp: new Date() }, ...prev].slice(0, 5));
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const connectROS = (confirmed = false) => {
    if (!confirmed) {
      setRosConfirmAction(rosStatus === 'connected' ? 'disconnect' : 'connect');
      return;
    }

    setRosConfirmAction(null);

    if (rosStatus === 'connected' && ros) {
      ros.close();
      return;
    }

    setRosStatus('connecting');
    addLog(`Connecting to ROS2 Bridge at ${rosUrl}...`);

    const rosInstance = new ROSLIB.Ros({
      url: rosUrl
    });

    rosInstance.on('connection', () => {
      setRosStatus('connected');
      setRosErrorMsg('');
      addLog('ROS2 Bridge connected successfully.');
      
      const batterySub = new ROSLIB.Topic({
        ros: rosInstance,
        name: '/battery_state',
        messageType: 'sensor_msgs/BatteryState'
      });
      batterySub.subscribe((msg: any) => {
        if (msg.percentage !== undefined) {
          const level = Math.round(msg.percentage * 100);
          setBattery(level);
          if (level < 20) {
            addNotification('warning', `Low Battery: ${level}%`);
          }
        }
      });

      const jointSub = new ROSLIB.Topic({
        ros: rosInstance,
        name: '/joint_states',
        messageType: 'sensor_msgs/JointState'
      });
      jointSub.subscribe((msg: any) => {
        if (msg.name && msg.position) {
          setJoints(prev => {
            const next = { ...prev };
            msg.name.forEach((name: string, i: number) => {
              if (next[name]) {
                const posVal = msg.position[i];
                const posDeg = (posVal * 180 / Math.PI).toFixed(1);
                const effort = msg.effort && msg.effort[i] ? msg.effort[i] : 0.0;
                
                const posHistory = [...(next[name].posHistory || []), posVal].slice(-30);
                const torqueHistory = [...(next[name].torqueHistory || []), effort].slice(-30);

                next[name] = { 
                  ...next[name], 
                  pos: `${posDeg}°`, 
                  torque: `${effort.toFixed(1)} Nm`,
                  posHistory,
                  torqueHistory
                };
              }
            });
            return next;
          });
        }
      });

      const rosoutSub = new ROSLIB.Topic({
        ros: rosInstance,
        name: '/rosout',
        messageType: 'rcl_interfaces/msg/Log'
      });
      rosoutSub.subscribe((msg: any) => {
        addLog(`[ROS] ${msg.msg}`);
      });

      const scanSub = new ROSLIB.Topic({
        ros: rosInstance,
        name: '/utlidar/cloud',
        messageType: 'sensor_msgs/PointCloud2'
      });
      scanSub.subscribe((msg: any) => {
        // PointCloud2 parsing is complex in JS, we'll keep a simplified version
        // or assume a bridge that provides a simpler format if needed.
        // For now, we'll keep the logic but update the topic name.
        // In a real app, we'd use a PointCloud2 decoder.
        if (msg.data) {
          addLog('Received PointCloud2 data from /utlidar/cloud');
        }
      });

      const laserScanSub = new ROSLIB.Topic({
        ros: rosInstance,
        name: '/scan',
        messageType: 'sensor_msgs/LaserScan'
      });
      laserScanSub.subscribe((msg: any) => {
        if (msg.ranges) {
          const points: number[][] = [];
          const angleMin = msg.angle_min;
          const angleIncrement = msg.angle_increment;
          msg.ranges.forEach((range: number, i: number) => {
            if (range > msg.range_min && range < msg.range_max) {
              const angle = angleMin + i * angleIncrement;
              points.push([
                range * Math.cos(angle),
                0,
                range * Math.sin(angle)
              ]);
            }
          });
          setLidarPoints(points);
        }
      });

      const odomSub = new ROSLIB.Topic({
        ros: rosInstance,
        name: '/odom',
        messageType: 'nav_msgs/Odometry'
      });
      odomSub.subscribe((msg: any) => {
        if (msg.pose && msg.pose.pose) {
          const pos = msg.pose.pose.position;
          const ori = msg.pose.pose.orientation;
          // Simple yaw from quaternion
          const yaw = 2 * Math.atan2(ori.z, ori.w);
          setRobotPose({ x: pos.x, y: pos.y, yaw });
          
          setTrajectory(prev => {
            const last = prev[prev.length - 1];
            if (!last || Math.sqrt((last.x - pos.x)**2 + (last.y - pos.y)**2) > 0.1) {
              return [...prev, { x: pos.x, y: pos.y }].slice(-200);
            }
            return prev;
          });
        }
      });
    });

    rosInstance.on('error', (error) => {
      setRosStatus('error');
      setRosErrorMsg('Connection refused or network error.');
      addLog(`ROS2 Connection Error.`);
      addNotification('error', 'ROS2 Connection Error');
    });

    rosInstance.on('close', () => {
      setRosStatus('disconnected');
      setRosErrorMsg('Connection closed.');
      addLog('ROS2 Connection closed.');
      addNotification('info', 'ROS2 Connection Closed');
    });

    setRos(rosInstance);
  };

  const captureImage = () => {
    setIsRecordingImage(true);
    addLog('Capturing image from robot camera...');
    
    // Simulate capture delay
    setTimeout(() => {
      const timestamp = new Date();
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#020617');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 32px monospace';
        ctx.fillText('ROBOT CAMERA SNAPSHOT', 40, 80);

        ctx.fillStyle = '#e5e7eb';
        ctx.font = '20px monospace';
        ctx.fillText(`Captured: ${timestamp.toLocaleString()}`, 40, 120);
        ctx.fillText(`Mode: ${cameraMode.toUpperCase()}`, 40, 150);

        // Crosshair overlay
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }

      const mockUrl = canvas.toDataURL('image/png');
      setCapturedImages(prev => [mockUrl, ...prev].slice(0, 10));
      setIsRecordingImage(false);
      addLog('Image captured and saved to temporary gallery.');
    }, 800);
  };

  const addTask = (type: 'move_arm' | 'grasp' | 'move_to', params: any) => {
    const newTask = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      params
    };
    setTasks(prev => [...prev, newTask]);
    addLog(`Added task: ${type.replace('_', ' ')}`);
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const moveTaskUp = (index: number) => {
    if (index === 0) return;
    setTasks(prev => {
      if (index <= 0 || index >= prev.length) return prev;
      const newTasks = [...prev];
      [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
      return newTasks;
    });
  };

  const moveTaskDown = (index: number) => {
    setTasks(prev => {
      if (index < 0 || index >= prev.length - 1) return prev;
      const newTasks = [...prev];
      [newTasks[index + 1], newTasks[index]] = [newTasks[index], newTasks[index + 1]];
      return newTasks;
    });
  };

  const executeTasks = async () => {
    if (tasks.length === 0) return;
    setIsTaskExecuting(true);
    addLog('Starting autonomous task sequence...');
    
    for (let i = 0; i < tasks.length; i++) {
      setCurrentTaskIndex(i);
      const task = tasks[i];
      addLog(`Executing task ${i + 1}/${tasks.length}: ${task.type.replace('_', ' ')}`);
      
      // Simulate task execution time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (ros && rosStatus === 'connected') {
        const taskTopic = new ROSLIB.Topic({ ros, name: '/task_status', messageType: 'std_msgs/String' });
        taskTopic.publish({ data: `COMPLETED: ${task.type}` } as any);
      }
    }
    
    setIsTaskExecuting(false);
    setCurrentTaskIndex(-1);
    addLog('Autonomous task sequence completed.');
  };

  const planFootsteps = () => {
    setIsPlanningFootsteps(true);
    addLog(`Planning footsteps to target: X=${targetPose.x}, Y=${targetPose.y}`);
    
    // Simulate planning
    setTimeout(() => {
      const newSteps: { x: number, y: number, side: 'left' | 'right' }[] = [];
      const dist = Math.sqrt(targetPose.x ** 2 + targetPose.y ** 2);
      const stepCount = Math.ceil(dist / 0.3); // 30cm steps
      
      for (let i = 1; i <= stepCount; i++) {
        const ratio = i / stepCount;
        newSteps.push({
          x: targetPose.x * ratio,
          y: targetPose.y * ratio,
          side: i % 2 === 0 ? 'right' : 'left'
        });
      }
      
      setFootsteps(newSteps);
      setIsPlanningFootsteps(false);
      addLog(`Generated ${newSteps.length} footsteps.`);
    }, 1200);
  };

  const executeFootsteps = async () => {
    if (footsteps.length === 0) return;
    addLog('Executing footstep sequence...');
    
    for (let i = 0; i < footsteps.length; i++) {
      const step = footsteps[i];
      // Simulate step
      await new Promise(resolve => setTimeout(resolve, 800));
      setRobotPose(prev => ({ ...prev, x: step.x, y: step.y }));
      
      if (ros && rosStatus === 'connected') {
        const stepTopic = new ROSLIB.Topic({ ros, name: '/footstep_status', messageType: 'std_msgs/String' });
        stepTopic.publish({ data: `STEP: ${i + 1}/${footsteps.length} (${step.side})` } as any);
      }
    }
    
    addLog('Footstep sequence completed.');
    setFootsteps([]);
  };

  const discoverTopics = () => {
    if (!ros || rosStatus !== 'connected') return;
    setIsDiscovering(true);
    ros.getTopics((result) => {
      const topics = result.topics.map((name, i) => ({
        name,
        type: result.types[i]
      }));
      setDiscoveredTopics(topics);
      setIsDiscovering(false);
      addLog(`Discovered ${topics.length} ROS2 topics.`);
    }, (error) => {
      console.error('Failed to discover topics:', error);
      setIsDiscovering(false);
      addLog('Failed to discover topics.');
    });
  };

  useEffect(() => {
    return () => {
      if (ros) ros.close();
    };
  }, [ros]);

  // Custom Topics Subscription Effect
  useEffect(() => {
    if (!ros || rosStatus !== 'connected') return;
    
    const topicName = cameraMode === 'rgb' 
      ? '/camera/camera/color/image_raw/compressed' 
      : '/camera/camera/depth/image_rect_raw/compressed';
      
    const cameraSub = new ROSLIB.Topic({
      ros: ros,
      name: topicName,
      messageType: 'sensor_msgs/CompressedImage'
    });

    cameraSub.subscribe((msg: any) => {
      const imgElement = document.getElementById('robot-camera-feed') as HTMLImageElement;
      if (imgElement) {
        imgElement.src = `data:image/jpeg;base64,${msg.data}`;
      }
    });

    return () => {
      cameraSub.unsubscribe();
    };
  }, [ros, rosStatus, cameraMode]);

  // Custom Topics Subscription Effect
  useEffect(() => {
    if (!ros || rosStatus !== 'connected') return;
    
    const currentSubs: Record<string, ROSLIB.Topic> = {};
    
    customTopics.forEach(t => {
      const topic = new ROSLIB.Topic({
        ros: ros,
        name: t.name,
        messageType: t.type
      });
      topic.subscribe((msg: any) => {
        setCustomTopicData(prev => ({ ...prev, [t.name]: msg }));
      });
      currentSubs[t.name] = topic;
    });

    return () => {
      Object.values(currentSubs).forEach(t => t.unsubscribe());
    };
  }, [ros, rosStatus, customTopics]);

  const handleModeChange = (newMode: string) => {
    if (newMode === mode) return;
    
    // If moving to a potentially dangerous mode, require confirmation
    if (newMode === 'Autonomous Navigation' || newMode === 'Calibration') {
      setPendingMode(newMode);
      return;
    }
    
    // Otherwise, switch immediately
    executeModeChange(newMode);
  };

  const executeModeChange = (newMode: string) => {
    if (ros && rosStatus === 'connected') {
      const modeCmd = new ROSLIB.Topic({ ros: ros, name: '/robot_mode', messageType: 'std_msgs/String' });
      modeCmd.publish({ data: newMode } as any);
    }
    
    setMode(newMode);
    setPendingMode(null);
    addLog(`Mode changed to: ${newMode}`);
    addNotification('info', `Mode: ${newMode}`);
    
    // If switching away from manual control, stop movement
    if (mode === 'Manual Control' && newMode !== 'Manual Control') {
      stopMove();
    }
  };

  const cancelModeChange = () => {
    setPendingMode(null);
  };

  const copyToClipboard = (text: string, topicName: string) => {
    if (!navigator.clipboard) {
      addNotification('warning', 'Clipboard API unavailable in this context.');
      addLog(`Failed to copy topic ${topicName}: Clipboard API unavailable.`);
      return;
    }

    navigator.clipboard.writeText(text)
      .then(() => {
        setCopyStatus(prev => ({ ...prev, [topicName]: true }));
        setTimeout(() => {
          setCopyStatus(prev => ({ ...prev, [topicName]: false }));
        }, 2000);
      })
      .catch(() => {
        addNotification('error', 'Copy to clipboard failed.');
        addLog(`Failed to copy topic ${topicName} to clipboard.`);
      });
  };

  const handleMove = (lx: number, ly: number, az: number) => {
    if (!ros || rosStatus !== 'connected') {
      addLog(`Cannot move: ROS2 not connected. (Cmd: lx=${lx}, ly=${ly}, az=${az})`);
      return;
    }
    if (mode !== 'Manual Control' && mode !== 'Walk' && mode !== 'Run') {
      addLog(`Cannot move: Robot is in ${mode} mode. Switch to Manual Control.`);
      return;
    }
    const cmdVel = new ROSLIB.Topic({
      ros: ros,
      name: '/cmd_vel',
      messageType: 'geometry_msgs/Twist'
    });
    const twist = {
      linear: { x: lx, y: ly, z: 0.0 },
      angular: { x: 0.0, y: 0.0, z: az }
    };
    cmdVel.publish(twist as any);
    addLog(`Published /cmd_vel: [lx:${lx}, ly:${ly}, az:${az}]`);
  };

  const stopMove = () => handleMove(0, 0, 0);

  const handleArmMove = (arm: 'left' | 'right', joint: string, direction: number) => {
    if (!ros || rosStatus !== 'connected') return;
    
    const armCmd = new ROSLIB.Topic({
      ros: ros,
      name: `/arm/${arm}/joint_cmd`,
      messageType: 'std_msgs/Float64'
    });
    
    // In a real scenario, we'd send a specific joint index and value
    armCmd.publish({ data: direction * 0.1 } as any);
    addLog(`Published ${arm} arm command: ${joint} ${direction > 0 ? '+' : '-'}`);
  };

  const emergencyStop = () => {
    stopMove();
    setMode('Standby');
    addLog('EMERGENCY STOP ACTIVATED! All movement halted.');
  };

  const toggleRosbag = (action: 'record' | 'play' | 'stop' | 'pause') => {
    if (!ros || rosStatus !== 'connected') {
      addLog(`Cannot ${action} rosbag: ROS2 not connected.`);
      return;
    }

    if ((action === 'stop' || action === 'play') && rosbagStatus !== 'idle' && !rosbagConfirmAction) {
      setRosbagConfirmAction(action);
      return;
    }

    const rosbagCmd = new ROSLIB.Topic({ ros: ros, name: '/rosbag_cmd', messageType: 'std_msgs/String' });
    
    let cmdData: string = action;
    let finalName = rosbagName.trim();
    
    if (action === 'record') {
      if (rosbagUseTimestamp) {
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        finalName = finalName ? `${finalName}_${ts}` : ts;
      }
      if (finalName) cmdData = `${action}:${finalName}`;
      if (rosbagDuration > 0) cmdData += `:duration=${rosbagDuration}`;
    } else if (action === 'play' && finalName) {
      cmdData = `${action}:${finalName}`;
    }
    
    rosbagCmd.publish({ data: cmdData } as any);
    
    if (action === 'record') setRosbagStatus('recording');
    else if (action === 'play') setRosbagStatus('playing');
    else if (action === 'pause') setRosbagStatus('paused');
    else {
      setRosbagStatus('idle');
      setRosbagProgress(0);
    }
    
    setRosbagConfirmAction(null);
    addLog(`Rosbag2 command sent: ${cmdData}`);
  };

  const handleSeek = (value: number) => {
    setRosbagProgress(value);
    if (ros && rosStatus === 'connected') {
      const rosbagCmd = new ROSLIB.Topic({ ros: ros, name: '/rosbag_cmd', messageType: 'std_msgs/String' });
      rosbagCmd.publish({ data: `seek:${value}` } as any);
      addLog(`Rosbag2 seek: ${value}%`);
    }
  };

  // Simulate playback progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (rosbagStatus === 'playing') {
      interval = setInterval(() => {
        setRosbagProgress(p => (p >= 100 ? 0 : p + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [rosbagStatus]);

  // Keyboard Teleoperation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (activeTab !== 'dashboard') return;
      
      switch(e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          handleMove(0.5, 0, 0);
          break;
        case 'arrowdown':
        case 's':
          handleMove(-0.5, 0, 0);
          break;
        case 'arrowleft':
        case 'a':
          handleMove(0, 0.5, 0);
          break;
        case 'arrowright':
        case 'd':
          handleMove(0, -0.5, 0);
          break;
        case 'q':
          handleMove(0, 0, 0.5);
          break;
        case 'e':
          handleMove(0, 0, -0.5);
          break;
        // Arm Controls
        case 'i':
          handleArmMove('left', 'pitch', 1);
          break;
        case 'k':
          handleArmMove('left', 'pitch', -1);
          break;
        case 'j':
          handleArmMove('left', 'roll', 1);
          break;
        case 'l':
          handleArmMove('left', 'roll', -1);
          break;
        case 'u':
          handleArmMove('right', 'pitch', 1);
          break;
        case 'o':
          handleArmMove('right', 'pitch', -1);
          break;
        case ' ':
          emergencyStop();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'q', 'e'].includes(e.key.toLowerCase())) {
        stopMove();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTab, ros, rosStatus, mode]);

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-300 font-sans flex flex-col selection:bg-emerald-500/30">
      {/* Notifications Overlay */}
      <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`
              pointer-events-auto min-w-[280px] p-4 rounded-xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-right-10 duration-300
              ${n.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 
                n.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 
                'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}
            `}
          >
            <div className="flex items-center gap-3">
              {n.type === 'error' ? <ShieldAlert className="w-5 h-5" /> : 
               n.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : 
               <Info className="w-5 h-5" />}
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-widest opacity-50">{n.type}</span>
                <span className="text-sm font-medium">{n.message}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Header */}
      <header className="h-16 border-b border-neutral-800/60 bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-neutral-900 rounded-md flex items-center justify-center border border-neutral-800 shadow-inner">
            <Cpu className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-neutral-100 font-bold tracking-widest text-sm uppercase">Unitree G1 EDU</h1>
            <div className="relative group flex items-center gap-2 mt-0.5 cursor-help">
              <span className={`w-1.5 h-1.5 rounded-full ${
                rosStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 
                rosStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                rosStatus === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-neutral-500'
              }`}></span>
              <span className="text-[10px] font-mono text-neutral-500">
                {rosStatus === 'connected' ? 'ROS2.ONLINE' : rosStatus === 'connecting' ? 'ROS2.CONNECTING' : rosStatus === 'error' ? 'ROS2.ERROR' : 'ROS2.OFFLINE'} // ID: G1-EDU-8842
              </span>
              
              {/* Tooltip */}
              <div className="absolute top-full left-0 mt-2 w-56 bg-neutral-900 border border-neutral-700 text-neutral-300 text-[10px] p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                <div className="font-bold mb-1 text-neutral-100">ROS2 Connection Status</div>
                <div>State: <span className="uppercase text-emerald-400">{rosStatus}</span></div>
                {rosErrorMsg && <div className="text-red-400 mt-1">Error: {rosErrorMsg}</div>}
                {!rosErrorMsg && rosStatus === 'connected' && <div className="mt-1 text-neutral-400">Connected to: {rosUrl}</div>}
                {!rosErrorMsg && rosStatus === 'disconnected' && <div className="mt-1 text-neutral-400">Ready to connect.</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-xs">
          {/* Tabs */}
          <div className="flex bg-neutral-900/50 p-1 rounded-lg border border-neutral-800/60">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 ${activeTab === 'dashboard' ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              <LayoutDashboard className="w-3 h-3" /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('topics')}
              className={`px-3 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 ${activeTab === 'topics' ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              <Database className="w-3 h-3" /> Topics
            </button>
            <button 
              onClick={() => setActiveTab('instructions')}
              className={`px-3 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 ${activeTab === 'instructions' ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              <Info className="w-3 h-3" /> Instrukcja
            </button>
          </div>

          {/* ROS2 Connection UI */}
          <div className="flex items-center gap-2 bg-neutral-900/50 p-1 rounded-lg border border-neutral-800/60 relative">
            {rosConfirmAction ? (
              <div className="flex items-center gap-2 px-2">
                <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest whitespace-nowrap">
                  Confirm {rosConfirmAction}?
                </span>
                <button 
                  onClick={() => setRosConfirmAction(null)}
                  className="px-2 py-1 bg-neutral-800 text-neutral-400 rounded text-[9px] font-bold hover:text-neutral-200 transition-colors"
                >
                  NO
                </button>
                <button 
                  onClick={() => connectROS(true)}
                  className="px-2 py-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded text-[9px] font-bold hover:bg-yellow-500/30 transition-colors"
                >
                  YES
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={rosUrl}
                  onChange={(e) => setRosUrl(e.target.value)}
                  className="bg-transparent border-none text-[10px] px-2 py-1 text-neutral-400 w-36 focus:outline-none focus:text-neutral-200"
                  placeholder="ws://localhost:9090"
                  disabled={rosStatus === 'connected' || rosStatus === 'connecting'}
                />
                <button
                  onClick={() => connectROS()}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 ${
                    rosStatus === 'connected' 
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                      : rosStatus === 'connecting'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {rosStatus === 'connected' ? <><Link2Off className="w-3 h-3"/> Disconnect</> : <><Link className="w-3 h-3"/> Connect</>}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-neutral-400">
            <Activity className="w-4 h-4" />
            <span>{rosStatus === 'connected' ? '12ms' : '--'}</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <Wifi className="w-4 h-4" />
            <span>WLAN_G1_5G</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <Battery className="w-4 h-4" />
            <span>{battery}%</span>
          </div>
          <div className="w-px h-6 bg-neutral-800 mx-2"></div>
          
          {/* Layout Switcher */}
          <div className="flex items-center gap-1 bg-neutral-900/50 p-1 rounded-lg border border-neutral-800/60">
            <button 
              onClick={() => setLayout('default')}
              className={`p-1.5 rounded transition-colors ${layout === 'default' ? 'bg-emerald-500/20 text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'}`}
              title="Default Layout"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setLayout('manual')}
              className={`p-1.5 rounded transition-colors ${layout === 'manual' ? 'bg-emerald-500/20 text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'}`}
              title="Manual Control Layout"
            >
              <Gamepad2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setLayout('autonomous')}
              className={`p-1.5 rounded transition-colors ${layout === 'autonomous' ? 'bg-emerald-500/20 text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'}`}
              title="Autonomous Monitoring Layout"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-neutral-800 mx-2"></div>
          <button className="w-9 h-9 rounded bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors border border-red-500/20">
            <Power className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-hidden flex flex-col">
        {activeTab === 'topics' ? (
          // ... (Topics content remains same)
          <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-xl p-6 shadow-lg h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-3">
                <Database className="w-6 h-6 text-emerald-400" />
                ROS2 Topic Explorer
              </h2>
              <button 
                onClick={discoverTopics}
                disabled={rosStatus !== 'connected' || isDiscovering}
                className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${
                  rosStatus === 'connected' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed'
                }`}
              >
                <Activity className={`w-3 h-3 ${isDiscovering ? 'animate-spin' : ''}`} />
                {isDiscovering ? 'Discovering...' : 'Discover Topics'}
              </button>
            </div>
            
            <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
              {/* Left Column: Discovered Topics */}
              <div className="col-span-12 lg:col-span-4 flex flex-col overflow-hidden">
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 px-2 flex justify-between items-center">
                  <span>Discovered ({discoveredTopics.length})</span>
                  <span className="text-[8px] opacity-50">Click to subscribe</span>
                </div>
                
                <div className="mb-3 px-2">
                  <input 
                    type="text"
                    placeholder="Filter topics..."
                    value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1 text-[9px] font-mono text-neutral-400 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {discoveredTopics.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-neutral-800 rounded-xl text-neutral-600 text-[10px] font-mono">
                      {rosStatus === 'connected' ? 'Click "Discover Topics" to scan.' : 'Connect to ROS2 to scan topics.'}
                    </div>
                  ) : (
                    discoveredTopics
                      .filter(t => t.name.toLowerCase().includes(topicSearch.toLowerCase()) || t.type.toLowerCase().includes(topicSearch.toLowerCase()))
                      .map(t => (
                      <button 
                        key={t.name}
                        onClick={() => {
                          if (!customTopics.find(x => x.name === t.name)) {
                            setCustomTopics(prev => [...prev, t]);
                          }
                        }}
                        className="w-full text-left p-2 rounded-lg bg-neutral-900/30 border border-neutral-800/60 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group"
                      >
                        <div className="text-emerald-400 font-mono text-[10px] font-bold truncate group-hover:text-emerald-300">{t.name}</div>
                        <div className="text-neutral-600 font-mono text-[8px] truncate">{t.type}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Subscriptions & Manual Add */}
              <div className="col-span-12 lg:col-span-8 flex flex-col overflow-hidden">
                {/* Add Topic Form */}
                <div className="flex gap-3 mb-4 bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 shrink-0">
                  <input 
                    type="text" 
                    placeholder="Topic Name" 
                    value={customTopicName}
                    onChange={e => setCustomTopicName(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-[10px] font-mono text-neutral-300 focus:outline-none focus:border-emerald-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Message Type" 
                    value={customTopicType}
                    onChange={e => setCustomTopicType(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-[10px] font-mono text-neutral-300 focus:outline-none focus:border-emerald-500"
                  />
                  <button 
                    onClick={() => {
                      if (customTopicName && customTopicType && !customTopics.find(t => t.name === customTopicName)) {
                        setCustomTopics(prev => [...prev, { name: customTopicName, type: customTopicType }]);
                        setCustomTopicName('');
                        setCustomTopicType('');
                      }
                    }}
                    className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold tracking-wider hover:bg-emerald-500/20 transition-colors"
                  >
                    ADD
                  </button>
                </div>

                {/* Topics List Header */}
                <div className="flex justify-between items-center mb-3 px-2">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    Active Subscriptions ({customTopics.length})
                  </div>
                  <div className="w-48">
                    <input 
                      type="text"
                      placeholder="Filter subscriptions..."
                      value={subscribedTopicSearch}
                      onChange={(e) => setSubscribedTopicSearch(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1 text-[9px] font-mono text-neutral-400 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                {/* Topics List */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {customTopics.length === 0 ? (
                    <div className="text-center text-neutral-500 text-[10px] mt-10 font-mono border border-dashed border-neutral-800 rounded-xl py-10">
                      No active subscriptions.
                    </div>
                  ) : (
                    customTopics
                      .filter(t => t.name.toLowerCase().includes(subscribedTopicSearch.toLowerCase()) || t.type.toLowerCase().includes(subscribedTopicSearch.toLowerCase()))
                      .map(t => (
                      <div key={t.name} className="bg-neutral-900/30 border border-neutral-800/60 rounded-xl overflow-hidden flex flex-col shrink-0">
                        <div className="px-4 py-2 bg-neutral-900/80 border-b border-neutral-800/60 flex justify-between items-center">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span className="text-emerald-400 font-mono text-xs font-bold truncate">{t.name}</span>
                            <span className="text-neutral-500 font-mono text-[9px] bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 truncate">{t.type}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <button 
                              onClick={() => copyToClipboard(JSON.stringify(customTopicData[t.name], null, 2), t.name)}
                              disabled={!customTopicData[t.name]}
                              className={`p-1.5 rounded border transition-all ${
                                copyStatus[t.name] 
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                                  : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-300 disabled:opacity-30'
                              }`}
                              title="Copy Data"
                            >
                              {copyStatus[t.name] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <button 
                              onClick={() => {
                                setCustomTopics(prev => prev.filter(x => x.name !== t.name));
                                setCustomTopicData(prev => {
                                  const next = { ...prev };
                                  delete next[t.name];
                                  return next;
                                });
                              }}
                              className="text-red-400 hover:text-red-300 text-[9px] font-bold tracking-wider uppercase bg-red-500/10 px-2 py-1 rounded border border-red-500/20 hover:bg-red-500/20 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="p-3 overflow-x-auto max-h-64 overflow-y-auto bg-black/20 custom-scrollbar">
                          <JsonView data={customTopicData[t.name]} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'instructions' ? (
          <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-xl p-8 shadow-lg max-w-5xl mx-auto w-full overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-8 border-b border-neutral-800 pb-6">
              <h2 className="text-2xl font-bold text-neutral-100 flex items-center gap-3">
                <Info className="w-7 h-7 text-emerald-400" />
                Dokumentacja Techniczna Unitree G1
              </h2>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20">SDK v2.0</span>
                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded border border-blue-500/20">ROS2 Humble</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* DDS Communication Routine */}
              <section className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-bold text-neutral-200 flex items-center gap-2 border-b border-neutral-800 pb-2">
                  <Cpu className="w-5 h-5 text-purple-400" />
                  DDS Communication Routine (Unitree SDK2)
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 space-y-3">
                    <h4 className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">1. Konfiguracja Środowiska</h4>
                    <p className="text-[10px] text-neutral-400 leading-relaxed">
                      SDK2 wykorzystuje <strong>CycloneDDS</strong>. Należy skonfigurować interfejs sieciowy (zazwyczaj <code className="text-purple-400">eth0</code> lub <code className="text-purple-400">enp3s0</code>).
                    </p>
                    <code className="block p-2 bg-black rounded text-[9px] text-neutral-500 font-mono">
                      export CYCLONEDDS_URI='&lt;CycloneDDS&gt;&lt;Domain&gt;&lt;General&gt;&lt;NetworkInterfaceAddress&gt;eth0&lt;/NetworkInterfaceAddress&gt;&lt;/General&gt;&lt;/Domain&gt;&lt;/CycloneDDS&gt;'
                    </code>
                  </div>
                  <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 space-y-3">
                    <h4 className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">2. Inicjalizacja Kanałów</h4>
                    <p className="text-[10px] text-neutral-400 leading-relaxed">
                      Komunikacja opiera się na strukturach IDL. Główne topiki DDS (bez prefixu ROS2):
                    </p>
                    <ul className="text-[9px] font-mono text-neutral-500 space-y-1">
                      <li>• <span className="text-purple-400">rt/lowcmd</span> (Low-level Control)</li>
                      <li>• <span className="text-purple-400">rt/lowstate</span> (Low-level State)</li>
                      <li>• <span className="text-purple-400">rt/highcmd</span> (High-level Control)</li>
                      <li>• <span className="text-purple-400">rt/highstate</span> (High-level State)</li>
                    </ul>
                  </div>
                  <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 space-y-3">
                    <h4 className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">3. Cykl Sterowania</h4>
                    <p className="text-[10px] text-neutral-400 leading-relaxed">
                      Wysyłanie komend musi odbywać się z określoną częstotliwością, aby uniknąć zadziałania Watchdoga.
                    </p>
                    <div className="flex items-center gap-4 text-[10px]">
                      <div className="flex flex-col">
                        <span className="text-neutral-500">Low-Level:</span>
                        <span className="text-emerald-400 font-bold">500Hz</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-neutral-500">High-Level:</span>
                        <span className="text-emerald-400 font-bold">50Hz</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ROS2 Communication Routine */}
              <section className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-bold text-neutral-200 flex items-center gap-2 border-b border-neutral-800 pb-2">
                  <Share2 className="w-5 h-5 text-blue-400" />
                  ROS2 Communication Routine
                </h3>
                <div className="bg-neutral-900/50 p-5 rounded-xl border border-neutral-800 space-y-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-3">
                      <h4 className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">Bridge DDS ↔ ROS2</h4>
                      <p className="text-[10px] text-neutral-400 leading-relaxed">
                        Unitree dostarcza paczkę <code className="text-blue-400">unitree_ros2</code>, która mapuje natywne topiki DDS na standardowe wiadomości ROS2.
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono bg-black/30 p-2 rounded">
                          <span className="text-neutral-500">DDS: rt/highcmd</span>
                          <ArrowRight className="w-3 h-3 text-neutral-600" />
                          <span className="text-blue-400">ROS2: /highcmd</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono bg-black/30 p-2 rounded">
                          <span className="text-neutral-500">DDS: rt/lowstate</span>
                          <ArrowRight className="w-3 h-3 text-neutral-600" />
                          <span className="text-blue-400">ROS2: /lowstate</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <h4 className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">Przykładowy Workflow</h4>
                      <ol className="text-[10px] text-neutral-400 space-y-2 list-decimal pl-4">
                        <li>Uruchomienie węzła komunikacyjnego: <br/>
                          <code className="text-[9px] text-neutral-500 font-mono bg-black px-1">ros2 run unitree_ros2 unitree_ros2_node</code>
                        </li>
                        <li>Subskrypcja stanu robota: <br/>
                          <code className="text-[9px] text-neutral-500 font-mono bg-black px-1">ros2 topic echo /highstate</code>
                        </li>
                        <li>Wysłanie komendy ruchu: <br/>
                          <code className="text-[9px] text-neutral-500 font-mono bg-black px-1">ros2 topic pub /cmd_vel geometry_msgs/Twist ...</code>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </section>

              {/* Lidar Section */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-neutral-200 flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  Unitree Lidar (Unilidar)
                </h3>
                <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 space-y-3">
                  <p className="text-xs leading-relaxed text-neutral-400">
                    Robot G1 wyposażony jest w 3D Lidar (Unitree L1) zapewniający 360° pola widzenia. Dane są publikowane jako chmura punktów.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-neutral-500">Topic:</span>
                      <span className="text-emerald-400">/utlidar/cloud</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-neutral-500">Type:</span>
                      <span className="text-neutral-300">sensor_msgs/PointCloud2</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-neutral-500">IMU Topic:</span>
                      <span className="text-emerald-400">/utlidar/imu</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <code className="block p-2 bg-black rounded text-[9px] text-neutral-500 font-mono">
                      ros2 launch unitree_lidar_ros2 run.launch.py
                    </code>
                  </div>
                </div>
              </section>

              {/* Camera Section */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-neutral-200 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-400" />
                  Intel RealSense D435
                </h3>
                <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 space-y-3">
                  <p className="text-xs leading-relaxed text-neutral-400">
                    Kamera głębi RealSense dostarcza obraz RGB oraz mapę głębi (Depth). Obsługiwana przez wrapper <span className="text-blue-400">realsense-ros</span>.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-neutral-500">RGB Topic:</span>
                      <span className="text-blue-400">/camera/camera/color/image_raw</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-neutral-500">Depth Topic:</span>
                      <span className="text-blue-400">/camera/camera/depth/image_rect_raw</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-neutral-500">Points:</span>
                      <span className="text-blue-400">/camera/camera/depth/color/points</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <code className="block p-2 bg-black rounded text-[9px] text-neutral-500 font-mono">
                      ros2 launch realsense2_camera rs_launch.py pointcloud.enable:=true
                    </code>
                  </div>
                </div>
              </section>

              {/* Control Section */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-neutral-200 flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-yellow-400" />
                  Interfejsy SDK2 (Sport Client)
                </h3>
                <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 space-y-3">
                  <p className="text-xs leading-relaxed text-neutral-400">
                    Główne usługi sterowania ruchem (Sport Client) dostępne przez SDK2:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between items-center text-[10px] font-mono p-2 bg-black/30 rounded">
                      <span className="text-neutral-500">Damping</span>
                      <span className="text-yellow-400">Zatrzymanie silników (bezpieczny tryb)</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono p-2 bg-black/30 rounded">
                      <span className="text-neutral-500">Recovery</span>
                      <span className="text-yellow-400">Powrót do stanu gotowości</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono p-2 bg-black/30 rounded">
                      <span className="text-neutral-500">StandUp / StandDown</span>
                      <span className="text-yellow-400">Wstawanie / Siadanie</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono p-2 bg-black/30 rounded">
                      <span className="text-neutral-500">Move(vx, vy, vyaw)</span>
                      <span className="text-yellow-400">Ruch z zadaną prędkością</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Robot State Section */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-neutral-200 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Robot State Client
                </h3>
                <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 space-y-3">
                  <p className="text-xs leading-relaxed text-neutral-400">
                    Dostęp do danych sensorycznych w czasie rzeczywistym:
                  </p>
                  <ul className="text-[10px] text-neutral-400 space-y-1 list-disc pl-4">
                    <li><strong>Joint States:</strong> Pozycje, prędkości i momenty wszystkich stawów.</li>
                    <li><strong>IMU Data:</strong> Orientacja, przyspieszenie kątowe i liniowe.</li>
                    <li><strong>Battery:</strong> Napięcie, prąd i procent naładowania.</li>
                    <li><strong>Foot Force:</strong> Siły nacisku na stopy (czujniki kontaktu).</li>
                  </ul>
                  <div className="pt-2">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-neutral-500">Service:</span>
                      <span className="text-emerald-400">rt/service/robot_state/request</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* DDS Interface Section */}
              <section className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-bold text-neutral-200 flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-400" />
                  DDS Services & Topics
                </h3>
                <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-neutral-500 uppercase">Główne Topiki DDS</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono border-b border-neutral-800 pb-1">
                          <span className="text-neutral-400">rt/lowcmd</span>
                          <span className="text-purple-400">Low-level Control</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-mono border-b border-neutral-800 pb-1">
                          <span className="text-neutral-400">rt/lowstate</span>
                          <span className="text-purple-400">Low-level Feedback</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-mono border-b border-neutral-800 pb-1">
                          <span className="text-neutral-400">rt/highcmd</span>
                          <span className="text-purple-400">High-level Control</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-mono border-b border-neutral-800 pb-1">
                          <span className="text-neutral-400">rt/highstate</span>
                          <span className="text-purple-400">High-level Feedback</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-neutral-500 uppercase">Struktura Serwisów</h4>
                      <p className="text-[10px] text-neutral-400">
                        Komunikacja Request-Response odbywa się poprzez parę topików:
                      </p>
                      <div className="p-2 bg-black/30 rounded space-y-1">
                        <div className="text-[9px] font-mono text-neutral-500">Request Topic:</div>
                        <div className="text-[9px] font-mono text-emerald-400">rt/service/[service_name]/request</div>
                        <div className="text-[9px] font-mono text-neutral-500 mt-1">Response Topic:</div>
                        <div className="text-[9px] font-mono text-blue-400">rt/service/[service_name]/response</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* System Info */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-neutral-200 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  Bezpieczeństwo i Diagnostyka
                </h3>
                <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 space-y-3">
                  <ul className="text-[10px] text-neutral-400 space-y-2 list-disc pl-4">
                    <li>Zawsze sprawdzaj stan baterii przed uruchomieniem procedur autonomicznych.</li>
                    <li>W przypadku utraty łączności (Watchdog), robot automatycznie przejdzie w tryb <strong>Damping</strong>.</li>
                    <li>Używaj przycisku <strong>Emergency Stop</strong> w interfejsie w razie nieprzewidzianych zachowań.</li>
                    <li>DDS Domain ID dla robotów Unitree to zazwyczaj <code className="text-emerald-400">0</code>.</li>
                    <li>Logi systemowe są agregowane z topicu <code className="text-neutral-300">/rosout</code>.</li>
                  </ul>
                </div>
              </section>

              {/* Hardware Overview */}
              <section className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-bold text-neutral-200 flex items-center gap-2 border-b border-neutral-800 pb-2">
                  <Box className="w-5 h-5 text-orange-400" />
                  Specyfikacja Sprzętowa G1
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 text-center">
                    <div className="text-[9px] text-neutral-500 uppercase font-bold mb-1">Stopnie Swobody</div>
                    <div className="text-xl font-bold text-neutral-200">23 - 43</div>
                    <div className="text-[9px] text-neutral-600 italic">Zależnie od wersji</div>
                  </div>
                  <div className="bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 text-center">
                    <div className="text-[9px] text-neutral-500 uppercase font-bold mb-1">Udźwig Ramion</div>
                    <div className="text-xl font-bold text-neutral-200">2.0 kg</div>
                    <div className="text-[9px] text-neutral-600 italic">Na każde ramię</div>
                  </div>
                  <div className="bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 text-center">
                    <div className="text-[9px] text-neutral-500 uppercase font-bold mb-1">Czas Pracy</div>
                    <div className="text-xl font-bold text-neutral-200">~2 h</div>
                    <div className="text-[9px] text-neutral-600 italic">Bateria 9000mAh</div>
                  </div>
                  <div className="bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 text-center">
                    <div className="text-[9px] text-neutral-500 uppercase font-bold mb-1">Procesor</div>
                    <div className="text-xl font-bold text-neutral-200">8-Core</div>
                    <div className="text-[9px] text-neutral-600 italic">High-performance Computing</div>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-12 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
              <h4 className="text-sm font-bold text-emerald-400 mb-4 uppercase tracking-widest">Szybki Start (Terminal)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] text-neutral-500 font-bold">1. Bridge</span>
                  <code className="block p-2 bg-black rounded text-[9px] text-neutral-300 font-mono">
                    ros2 launch rosbridge_server rosbridge_websocket_launch.xml
                  </code>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-neutral-500 font-bold">2. Robot SDK</span>
                  <code className="block p-2 bg-black rounded text-[9px] text-neutral-300 font-mono">
                    ros2 run unitree_sdk2_ros2 sport_node
                  </code>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-neutral-500 font-bold">3. Visualization</span>
                  <code className="block p-2 bg-black rounded text-[9px] text-neutral-300 font-mono">
                    rviz2 -d unitree_g1.rviz
                  </code>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6 h-full">
            {/* Left Column - Camera & Vision */}
            <div className={`col-span-12 flex flex-col gap-4 h-full ${layout === 'manual' ? 'lg:col-span-8' : layout === 'autonomous' ? 'lg:col-span-7' : 'lg:col-span-4'}`}>
              {/* Status Summary Card */}
              <div className="grid grid-cols-4 gap-4 shrink-0">
                <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Battery Level</span>
                  <div className="flex items-center gap-2">
                    <Battery className={`w-4 h-4 ${battery < 20 ? 'text-red-400' : 'text-emerald-400'}`} />
                    <span className={`text-lg font-bold font-mono ${battery < 20 ? 'text-red-400' : 'text-neutral-200'}`}>{battery}%</span>
                  </div>
                </div>
                <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Operation Mode</span>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-neutral-200 truncate">{mode}</span>
                  </div>
                </div>
                <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Joint Status</span>
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-bold text-neutral-200">
                      {Object.values(joints).filter(j => j.status !== 'normal').length > 0 ? 'Warning' : 'Nominal'}
                    </span>
                  </div>
                </div>
                <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Control Status</span>
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-bold text-neutral-200">Keyboard Active</span>
                  </div>
                </div>
              </div>

              {/* Teleoperation Guide */}
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Teleoperation Guide</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-[9px] font-mono">
                  <div className="space-y-1">
                    <div className="text-neutral-500 uppercase font-bold mb-1">Base Movement</div>
                    <div className="flex justify-between"><span className="text-neutral-300">W / S</span> <span className="text-emerald-500">Forward / Back</span></div>
                    <div className="flex justify-between"><span className="text-neutral-300">A / D</span> <span className="text-emerald-500">Left / Right</span></div>
                    <div className="flex justify-between"><span className="text-neutral-300">Q / E</span> <span className="text-emerald-500">Rotate L / R</span></div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-neutral-500 uppercase font-bold mb-1">Left Arm</div>
                    <div className="flex justify-between"><span className="text-neutral-300">I / K</span> <span className="text-blue-500">Pitch Up / Down</span></div>
                    <div className="flex justify-between"><span className="text-neutral-300">J / L</span> <span className="text-blue-500">Roll L / R</span></div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-neutral-500 uppercase font-bold mb-1">Right Arm</div>
                    <div className="flex justify-between"><span className="text-neutral-300">U / O</span> <span className="text-purple-500">Pitch Up / Down</span></div>
                    <div className="flex justify-between"><span className="text-neutral-300">Space</span> <span className="text-red-500 font-bold">EMERGENCY STOP</span></div>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-neutral-900/40 border border-neutral-800/60 rounded-xl overflow-hidden relative group">
            <div className="px-4 py-3 border-b border-neutral-800/60 flex justify-between items-center bg-neutral-900/30">
              <div className="flex items-center gap-4 text-neutral-300">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  <span className="text-[11px] font-bold tracking-widest uppercase">Visual Feedback</span>
                </div>
                <div className="flex bg-black/40 p-0.5 rounded border border-neutral-800">
                  <button 
                    onClick={() => setViewMode('camera')}
                    className={`px-2 py-1 rounded text-[9px] font-bold tracking-wider uppercase transition-all ${viewMode === 'camera' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-500 hover:text-neutral-400'}`}
                  >
                    Camera
                  </button>
                  <button 
                    onClick={() => setViewMode('3d')}
                    className={`px-2 py-1 rounded text-[9px] font-bold tracking-wider uppercase transition-all ${viewMode === '3d' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-500 hover:text-neutral-400'}`}
                  >
                    3D View
                  </button>
                  <button 
                    onClick={() => setViewMode('map')}
                    className={`px-2 py-1 rounded text-[9px] font-bold tracking-wider uppercase transition-all ${viewMode === 'map' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-500 hover:text-neutral-400'}`}
                  >
                    Map/SLAM
                  </button>
                </div>
              </div>
              <div className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                {viewMode === 'camera' ? `${cameraMode.toUpperCase()} VIEW | 1920x1080 @ 60FPS` : viewMode === '3d' ? 'REAL-TIME KINEMATICS' : 'LIDAR SLAM VIEW'}
              </div>
            </div>
            <div className={`relative bg-black overflow-hidden group w-full ${viewMode === 'camera' ? 'aspect-video' : 'flex-1'}`}>
              {viewMode === 'camera' ? (
                <>
                  {/* Placeholder for camera feed */}
                  <img 
                    id="robot-camera-feed"
                    src={cameraMode === 'rgb' 
                      ? "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2070&auto=format&fit=crop"
                      : "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
                    } 
                    alt="Camera Feed" 
                    className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ${
                      cameraMode === 'rgb' ? 'opacity-50 grayscale contrast-125' : 'opacity-70 hue-rotate-180 contrast-150 brightness-75'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                  {/* HUD Overlay */}
                  <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded border border-white/5">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-red-400 text-[10px] font-mono tracking-wider">REC</span>
                        </div>
                        
                        <div className="flex flex-col gap-2 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-4 bg-neutral-800 rounded-sm relative overflow-hidden border border-neutral-700">
                              <div 
                                className={`h-full transition-all duration-500 ${battery < 20 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${battery}%` }}
                              ></div>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-neutral-200">{battery}%</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className={`w-2 h-2 rounded-full ${rosStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                              {rosStatus === 'connected' && <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75"></div>}
                            </div>
                            <span className="text-[10px] font-mono text-neutral-300 uppercase tracking-tight">ROS: {rosStatus}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <Cpu className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[10px] font-mono text-neutral-300 uppercase tracking-tight">{mode}</span>
                          </div>
                        </div>
                      </div>
                    <div className="flex gap-2 pointer-events-auto">
                        <button 
                          onClick={captureImage}
                          disabled={isRecordingImage}
                          className={`p-1.5 rounded backdrop-blur-sm transition-all bg-black/40 border border-neutral-800 text-neutral-400 hover:text-emerald-400 ${isRecordingImage ? 'animate-pulse' : ''}`}
                          title="Record Image"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setCameraMode('rgb')}
                          className={`text-[9px] font-mono border px-2 py-1 rounded backdrop-blur-sm transition-all ${
                            cameraMode === 'rgb' ? 'text-emerald-400 border-emerald-500/50 bg-emerald-500/20' : 'text-neutral-500 border-neutral-800 bg-black/40 hover:text-neutral-300'
                          }`}
                        >
                          RGB
                        </button>
                        <button 
                          onClick={() => setCameraMode('depth')}
                          className={`text-[9px] font-mono border px-2 py-1 rounded backdrop-blur-sm transition-all ${
                            cameraMode === 'depth' ? 'text-emerald-400 border-emerald-500/50 bg-emerald-500/20' : 'text-neutral-500 border-neutral-800 bg-black/40 hover:text-neutral-300'
                          }`}
                        >
                          DEPTH
                        </button>
                      </div>
                      <div className="text-emerald-400 text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded backdrop-blur-sm">
                        VISION: ACTIVE
                      </div>
                    </div>
                    
                    <div className="flex justify-center items-center flex-1">
                      <div className="w-48 h-48 border border-emerald-500/20 rounded-full flex items-center justify-center relative">
                        <div className="w-32 h-32 border border-emerald-500/40 rounded-full border-dashed animate-[spin_20s_linear_infinite]"></div>
                        <div className="absolute w-2 h-2 bg-emerald-500/80 rounded-full shadow-[0_0_10px_rgba(16,185,129,1)]"></div>
                        <div className="absolute top-0 w-full h-[1px] bg-emerald-500/20"></div>
                        <div className="absolute left-0 w-[1px] h-full bg-emerald-500/20"></div>
                        
                        {/* Target box */}
                        <div className="absolute top-1/4 left-1/3 w-16 h-16 border border-emerald-400/60 bg-emerald-400/5">
                          <div className="absolute -top-4 left-0 text-[8px] font-mono text-emerald-400">OBJ_01: 98%</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="text-emerald-400 text-[10px] font-mono leading-relaxed bg-black/40 p-2 rounded backdrop-blur-sm border border-emerald-500/20">
                        PITCH: -2.4°<br/>
                        YAW:   +0.1°<br/>
                        ROLL:  +0.0°
                      </div>
                      <div className="text-emerald-400 text-[10px] font-mono text-right leading-relaxed bg-black/40 p-2 rounded backdrop-blur-sm border border-emerald-500/20">
                        TARGET: TRACKING<br/>
                        DIST: 1.24m
                      </div>
                    </div>
                  </div>
                </>
              ) : viewMode === '3d' ? (
                <Robot3D joints={joints} />
              ) : (
                <LidarMap points={lidarPoints} robotPose={robotPose} trajectory={trajectory} />
              )}
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-xl flex-1 flex flex-col min-h-[200px] shadow-lg">
            <div className="px-4 py-3 border-b border-neutral-800/60 flex justify-between items-center bg-neutral-900/30">
              <span className="text-[11px] font-bold tracking-widest uppercase text-neutral-300">System Logs (/rosout)</span>
              <Settings className="w-4 h-4 text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors" />
            </div>
            <div className="p-4 flex-1 overflow-y-auto font-mono text-[11px] space-y-2 leading-relaxed">
              {logs.map((log, i) => (
                <div key={i} className={`
                  ${log.includes('Error') || log.includes('Warning') ? 'text-yellow-400' : ''}
                  ${log.includes('connected') || log.includes('engaged') ? 'text-emerald-400' : ''}
                  ${!log.includes('Error') && !log.includes('Warning') && !log.includes('connected') && !log.includes('engaged') ? 'text-neutral-400' : ''}
                `}>
                  {log}
                </div>
              ))}
              <div className="text-neutral-500 animate-pulse">_</div>
            </div>
          </div>
        </div>

        {/* Right Column - Controls & Telemetry */}
        <div className={`col-span-12 flex flex-col gap-6 h-full ${layout === 'manual' ? 'lg:col-span-4' : layout === 'autonomous' ? 'lg:col-span-5' : 'lg:col-span-8'}`}>
          
          {layout === 'autonomous' ? (
            <>
              {/* Task Execution Panel */}
              <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-xl p-5 shadow-lg flex flex-col h-1/2 overflow-hidden">
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px] font-bold tracking-widest uppercase text-neutral-300">Task Execution</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={executeTasks}
                      disabled={tasks.length === 0 || isTaskExecuting}
                      className={`px-3 py-1 rounded text-[9px] font-bold tracking-wider uppercase transition-all ${
                        tasks.length > 0 && !isTaskExecuting ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-900 text-neutral-600 border-neutral-800'
                      }`}
                    >
                      {isTaskExecuting ? 'Executing...' : 'Run Sequence'}
                    </button>
                    <button 
                      onClick={() => setTasks([])}
                      disabled={isTaskExecuting}
                      className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar">
                  {tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-600 text-[10px] font-mono border border-dashed border-neutral-800 rounded-lg py-10">
                      No tasks defined.
                    </div>
                  ) : (
                    tasks.map((task, idx) => (
                      <div 
                        key={task.id} 
                        className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                          currentTaskIndex === idx ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-neutral-900/50 border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-mono ${currentTaskIndex === idx ? 'text-emerald-400' : 'text-neutral-600'}`}>
                            {idx + 1}.
                          </span>
                          <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wide">
                            {task.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {currentTaskIndex === idx && <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />}
                          <div className="flex items-center bg-black/20 rounded border border-neutral-800">
                            <button 
                              onClick={() => moveTaskUp(idx)}
                              disabled={isTaskExecuting || idx === 0}
                              className="p-1 text-neutral-600 hover:text-neutral-300 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => moveTaskDown(idx)}
                              disabled={isTaskExecuting || idx === tasks.length - 1}
                              className="p-1 text-neutral-600 hover:text-neutral-300 disabled:opacity-30 border-l border-neutral-800"
                              title="Move Down"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeTask(task.id)}
                            disabled={isTaskExecuting}
                            className="p-1 text-neutral-600 hover:text-red-400 transition-colors"
                            title="Remove Task"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 shrink-0">
                  <button 
                    onClick={() => addTask('move_to', { x: 1, y: 0 })}
                    className="py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-[9px] font-bold text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-all"
                  >
                    + MOVE TO
                  </button>
                  <button 
                    onClick={() => addTask('move_arm', { pos: 'extended' })}
                    className="py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-[9px] font-bold text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-all"
                  >
                    + ARM MOVE
                  </button>
                  <button 
                    onClick={() => addTask('grasp', { action: 'close' })}
                    className="py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-[9px] font-bold text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-all"
                  >
                    + GRASP
                  </button>
                </div>
              </div>

              {/* Footstep Planning Panel */}
              <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-xl p-5 shadow-lg flex flex-col h-1/2 overflow-hidden">
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-blue-400" />
                    <span className="text-[11px] font-bold tracking-widest uppercase text-neutral-300">Footstep Planning</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={planFootsteps}
                      disabled={isPlanningFootsteps}
                      className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] font-bold tracking-wider uppercase hover:bg-blue-500/20 transition-all"
                    >
                      {isPlanningFootsteps ? 'Planning...' : 'Plan'}
                    </button>
                    <button 
                      onClick={executeFootsteps}
                      disabled={footsteps.length === 0}
                      className={`px-3 py-1 rounded text-[9px] font-bold tracking-wider uppercase transition-all ${
                        footsteps.length > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-900 text-neutral-600 border-neutral-800'
                      }`}
                    >
                      Execute
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 shrink-0">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase">Target X (m)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={targetPose.x}
                      onChange={e => setTargetPose(prev => ({ ...prev, x: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[10px] font-mono text-neutral-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase">Target Y (m)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={targetPose.y}
                      onChange={e => setTargetPose(prev => ({ ...prev, y: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[10px] font-mono text-neutral-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-black/20 rounded-lg p-3 border border-neutral-800/50 custom-scrollbar">
                  {footsteps.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-600 text-[9px] font-mono italic">
                      No plan generated.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {footsteps.map((step, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[9px] font-mono py-1 border-b border-neutral-800/30 last:border-0">
                          <span className="text-neutral-500">{idx + 1}.</span>
                          <span className={step.side === 'left' ? 'text-emerald-400' : 'text-blue-400'}>
                            {step.side.toUpperCase()}
                          </span>
                          <span className="text-neutral-300">[{step.x.toFixed(2)}, {step.y.toFixed(2)}]</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Status & Modes */}
              <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-xl p-5 shadow-lg shrink-0 relative overflow-hidden">
            <div className="flex justify-between items-center mb-5">
              <span className="text-[11px] font-bold tracking-widest uppercase text-neutral-300">Operation Mode</span>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono rounded border border-emerald-500/20">
                {mode.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['Standby', 'Manual Control', 'Autonomous Navigation', 'Calibration'].map(m => (
                <button 
                  key={m}
                  onClick={() => handleModeChange(m)}
                  className={`py-2.5 px-2 text-[10px] font-medium tracking-wide rounded-lg border transition-all duration-200 ${
                    mode === m 
                      ? 'bg-neutral-100 text-neutral-900 border-neutral-100 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Mode Transition Overlay */}
            {pendingMode && (
              <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-10">
                <AlertTriangle className="w-6 h-6 text-yellow-500 mb-2" />
                <p className="text-[11px] text-center text-neutral-300 mb-4">
                  Confirm transition to <br/>
                  <span className="font-bold text-yellow-400">{pendingMode}</span>?
                </p>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={cancelModeChange}
                    className="flex-1 py-2 bg-neutral-800 text-neutral-300 rounded-lg text-[10px] font-bold hover:bg-neutral-700 transition-colors"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={() => executeModeChange(pendingMode)}
                    className="flex-1 py-2 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded-lg text-[10px] font-bold hover:bg-yellow-500/30 transition-colors"
                  >
                    CONFIRM
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Movement Controls */}
          <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-xl p-4 flex flex-col items-center justify-center shadow-lg shrink-0">
            <div className="w-full flex justify-between items-center mb-4">
              <span className="text-[11px] font-bold tracking-widest uppercase text-neutral-300">Locomotion (/cmd_vel)</span>
              <Gamepad2 className="w-4 h-4 text-neutral-500" />
            </div>
            
            <div className="grid grid-cols-3 gap-2 w-44 mb-4">
              <div className="col-start-2">
                <button 
                  onMouseDown={() => handleMove(0.5, 0, 0)}
                  onMouseUp={stopMove}
                  onMouseLeave={stopMove}
                  className="w-12 h-12 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 hover:border-neutral-600 active:bg-neutral-700 transition-all shadow-sm select-none"
                >
                  <ArrowUp className="w-4 h-4 text-neutral-300" />
                </button>
              </div>
              <div className="col-start-1 row-start-2">
                <button 
                  onMouseDown={() => handleMove(0, 0.5, 0)}
                  onMouseUp={stopMove}
                  onMouseLeave={stopMove}
                  className="w-12 h-12 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 hover:border-neutral-600 active:bg-neutral-700 transition-all shadow-sm select-none"
                >
                  <ArrowLeft className="w-4 h-4 text-neutral-300" />
                </button>
              </div>
              <div className="col-start-2 row-start-2">
                <button 
                  onMouseDown={() => handleMove(-0.5, 0, 0)}
                  onMouseUp={stopMove}
                  onMouseLeave={stopMove}
                  className="w-12 h-12 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 hover:border-neutral-600 active:bg-neutral-700 transition-all shadow-sm select-none"
                >
                  <ArrowDown className="w-4 h-4 text-neutral-300" />
                </button>
              </div>
              <div className="col-start-3 row-start-2">
                <button 
                  onMouseDown={() => handleMove(0, -0.5, 0)}
                  onMouseUp={stopMove}
                  onMouseLeave={stopMove}
                  className="w-12 h-12 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 hover:border-neutral-600 active:bg-neutral-700 transition-all shadow-sm select-none"
                >
                  <ArrowRight className="w-4 h-4 text-neutral-300" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 w-full justify-center">
              <button 
                onMouseDown={() => handleMove(0, 0, 0.5)}
                onMouseUp={stopMove}
                onMouseLeave={stopMove}
                className="flex-1 py-2 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center gap-2 hover:bg-neutral-800 hover:border-neutral-600 active:bg-neutral-700 transition-all text-[10px] font-medium tracking-wide text-neutral-300 select-none"
              >
                <RotateCcw className="w-3 h-3" /> TURN L
              </button>
              <button 
                onMouseDown={() => handleMove(0, 0, -0.5)}
                onMouseUp={stopMove}
                onMouseLeave={stopMove}
                className="flex-1 py-2 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center gap-2 hover:bg-neutral-800 hover:border-neutral-600 active:bg-neutral-700 transition-all text-[10px] font-medium tracking-wide text-neutral-300 select-none"
              >
                TURN R <RotateCw className="w-3 h-3" />
              </button>
            </div>

            {/* STOP & ESTOP */}
            <div className="flex gap-2 w-full justify-center mt-2">
              <button 
                onClick={stopMove}
                className="flex-1 py-2 bg-yellow-500/10 text-yellow-500 rounded-xl border border-yellow-500/20 flex items-center justify-center gap-2 hover:bg-yellow-500/20 transition-all text-[10px] font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(234,179,8,0.1)]"
              >
                <Octagon className="w-3 h-3" /> STOP
              </button>
              <button 
                onClick={emergencyStop}
                className="flex-1 py-2 bg-red-500/10 text-red-500 rounded-xl border border-red-500/30 flex items-center justify-center gap-2 hover:bg-red-500/20 hover:border-red-500/50 transition-all text-[10px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                <ShieldAlert className="w-3 h-3" /> E-STOP
              </button>
            </div>

            {/* Rosbag2 Controls */}
            <div className="w-full mt-4 pt-4 border-t border-neutral-800/60">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-500">Rosbag2 Control</span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                  rosbagStatus === 'recording' ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' :
                  rosbagStatus === 'playing' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse' :
                  rosbagStatus === 'paused' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                  'bg-neutral-900 text-neutral-500 border-neutral-800'
                }`}>
                  {rosbagStatus.toUpperCase()}
                </span>
              </div>

              {/* Filename Input */}
              <div className="mb-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rosbagName}
                    onChange={(e) => setRosbagName(e.target.value)}
                    placeholder="Filename (e.g., test_run_01)"
                    disabled={rosbagStatus !== 'idle'}
                    className="flex-1 bg-neutral-900/50 border border-neutral-800 rounded-lg px-3 py-2 text-[10px] font-mono text-neutral-300 focus:outline-none focus:border-neutral-600 disabled:opacity-50 placeholder:text-neutral-600"
                  />
                  <button 
                    onClick={() => setRosbagUseTimestamp(!rosbagUseTimestamp)}
                    className={`px-2 rounded-lg border text-[9px] font-bold transition-all ${rosbagUseTimestamp ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}
                    title="Append Timestamp"
                  >
                    TS
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase">Duration:</span>
                  <input
                    type="number"
                    value={rosbagDuration}
                    onChange={(e) => setRosbagDuration(parseInt(e.target.value) || 0)}
                    placeholder="0 = ∞"
                    disabled={rosbagStatus !== 'idle'}
                    className="w-16 bg-neutral-900/50 border border-neutral-800 rounded-lg px-2 py-1 text-[10px] font-mono text-neutral-300 focus:outline-none focus:border-neutral-600 disabled:opacity-50"
                  />
                  <span className="text-[9px] font-mono text-neutral-600">sec</span>
                </div>
              </div>

              {/* Confirmation Overlay */}
              {rosbagConfirmAction && (
                <div className="mb-3 p-2 bg-neutral-900 border border-yellow-500/30 rounded-lg flex flex-col items-center gap-2">
                  <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-wider">Confirm {rosbagConfirmAction}?</span>
                  <div className="flex gap-2 w-full">
                    <button 
                      onClick={() => setRosbagConfirmAction(null)}
                      className="flex-1 py-1 bg-neutral-800 text-neutral-400 rounded text-[9px] font-bold"
                    >
                      NO
                    </button>
                    <button 
                      onClick={() => toggleRosbag(rosbagConfirmAction)}
                      className="flex-1 py-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded text-[9px] font-bold"
                    >
                      YES
                    </button>
                  </div>
                </div>
              )}
              
              {/* Progress Bar for Playback */}
              {(rosbagStatus === 'playing' || rosbagStatus === 'paused') && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-[9px] font-mono text-neutral-500 w-6">{rosbagProgress}%</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={rosbagProgress} 
                    onChange={(e) => handleSeek(parseInt(e.target.value))}
                    className="flex-1 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => toggleRosbag('record')}
                  disabled={rosbagStatus === 'playing' || rosbagStatus === 'paused'}
                  className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wider transition-all ${
                    rosbagStatus === 'idle' ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800' : 
                    rosbagStatus === 'recording' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                    'bg-neutral-900/50 border-neutral-800/50 text-neutral-600 cursor-not-allowed'
                  }`}
                >
                  <Circle className={`w-3 h-3 ${rosbagStatus === 'recording' ? 'text-red-500 fill-red-500 animate-pulse' : 'text-red-500/50 fill-red-500/50'}`} /> REC
                </button>
                <button 
                  onClick={() => toggleRosbag('stop')}
                  disabled={rosbagStatus === 'idle'}
                  className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wider transition-all ${
                    rosbagStatus !== 'idle' ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800' : 'bg-neutral-900/50 border-neutral-800/50 text-neutral-600 cursor-not-allowed'
                  }`}
                >
                  <Square className="w-3 h-3 text-yellow-500 fill-yellow-500" /> STOP
                </button>
                
                {rosbagStatus === 'playing' ? (
                  <button 
                    onClick={() => toggleRosbag('pause')}
                    className="flex-1 py-2 rounded-lg border bg-emerald-500/20 border-emerald-500/50 text-emerald-400 flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wider transition-all"
                  >
                    <div className="w-1 h-3 bg-emerald-400 rounded-sm"></div>
                    <div className="w-1 h-3 bg-emerald-400 rounded-sm"></div> PAUSE
                  </button>
                ) : (
                  <button 
                    onClick={() => toggleRosbag('play')}
                    disabled={rosbagStatus === 'recording'}
                    className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wider transition-all ${
                      rosbagStatus === 'idle' || rosbagStatus === 'paused' ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800' : 'bg-neutral-900/50 border-neutral-800/50 text-neutral-600 cursor-not-allowed'
                    }`}
                  >
                    <Play className={`w-3 h-3 ${rosbagStatus === 'paused' ? 'text-emerald-500 fill-emerald-500 animate-pulse' : 'text-emerald-500/50 fill-emerald-500/50'}`} /> PLAY
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Telemetry */}
          <div className={`bg-[#0a0a0a] border border-neutral-800/60 rounded-xl p-5 shadow-lg flex flex-col ${layout === 'manual' ? 'h-1/3' : 'flex-1'}`}>
            <div className="flex justify-between items-center mb-5">
              <span className="text-[11px] font-bold tracking-widest uppercase text-neutral-300">Joint Telemetry (/joint_states)</span>
              <Activity className="w-4 h-4 text-neutral-500" />
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {/* Grouped Joints */}
              {(() => {
                const groups: Record<string, string[]> = {
                  'Left Leg': ['L_HIP_PITCH', 'L_HIP_ROLL', 'L_KNEE', 'L_ANKLE_PITCH'],
                  'Right Leg': ['R_HIP_PITCH', 'R_HIP_ROLL', 'R_KNEE', 'R_ANKLE_PITCH'],
                  'Torso': ['TORSO_YAW']
                };

                return Object.entries(groups).map(([groupName, jointNames]) => (
                  <div key={groupName} className="space-y-1">
                    <div className="px-2 py-1 bg-neutral-900/50 rounded text-[9px] font-bold text-neutral-500 uppercase tracking-widest border-l-2 border-emerald-500/30">
                      {groupName}
                    </div>
                    {jointNames.map(label => {
                      const data = joints[label];
                      if (!data) return null;
                      return (
                        <TelemetryRow 
                          key={label}
                          label={label} 
                          value={data.pos} 
                          torque={data.torque} 
                          temp={data.temp} 
                          status={data.status}
                          posHistory={data.posHistory}
                          torqueHistory={data.torqueHistory}
                          isExpanded={expandedJoints[label]}
                          onToggle={() => setExpandedJoints(prev => ({ ...prev, [label]: !prev[label] }))}
                        />
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Image Gallery (Captured Images) */}
          {capturedImages.length > 0 && (
            <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-xl p-4 shadow-lg shrink-0">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-500">Captured Images</span>
                <button onClick={() => setCapturedImages([])} className="text-[9px] text-neutral-600 hover:text-red-400">Clear</button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {capturedImages.map((img, i) => (
                  <div key={i} className="relative group shrink-0">
                    <img src={img} alt={`Capture ${i}`} className="w-16 h-12 object-cover rounded border border-neutral-800" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                      <Maximize2 className="w-3 h-3 text-white cursor-pointer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </>
      )}
    </div>
  </div>
)}
</main>
</div>
);
}

function JsonView({ data }: { data: any }) {
  if (!data) return <span className="text-neutral-600 text-[10px] font-mono italic">Waiting for messages...</span>;

  const json = JSON.stringify(data, null, 2);
  
  // Simple syntax highlighting using regex
  // We escape HTML characters first to prevent XSS and ensure correct rendering
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const highlighted = escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'text-blue-400'; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-emerald-400'; // key
        } else {
          cls = 'text-yellow-400'; // string
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-purple-400'; // boolean
      } else if (/null/.test(match)) {
        cls = 'text-red-400'; // null
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );

  return (
    <pre 
      className="text-[10px] font-mono m-0 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

function TelemetryRow({ label, value, torque, temp, status = 'normal', posHistory = [], torqueHistory = [], isExpanded, onToggle }: { 
  label: string, 
  value: string, 
  torque: string, 
  temp: string, 
  status?: 'normal' | 'warning' | 'error',
  posHistory?: number[],
  torqueHistory?: number[],
  isExpanded?: boolean,
  onToggle?: () => void
}) {
  const statusColors = {
    normal: 'text-neutral-300',
    warning: 'text-yellow-400',
    error: 'text-red-400'
  };

  return (
    <div className={`flex flex-col border border-transparent transition-all rounded-lg overflow-hidden ${isExpanded ? 'bg-neutral-900/40 border-neutral-800/60 mb-2' : 'hover:bg-neutral-900/30'}`}>
      <button 
        onClick={onToggle}
        className={`flex items-center justify-between text-[11px] p-2 w-full text-left transition-colors ${status === 'warning' ? 'bg-yellow-500/5' : ''}`}
      >
        <div className="flex items-center gap-2 w-32">
          <span className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
          </span>
          <span className="text-neutral-400 font-mono flex items-center gap-1.5 truncate">
            {status === 'warning' && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
            {status === 'error' && <ShieldAlert className="w-3 h-3 text-red-500" />}
            {label}
          </span>
        </div>
        
        <div className="flex items-center gap-4 flex-1 justify-end">
          {!isExpanded && (
            <>
              <span className="font-mono text-neutral-200 w-16 text-right">{value}</span>
              <span className="font-mono text-neutral-500 w-16 text-right">{torque}</span>
            </>
          )}
          <span className={`font-mono w-10 text-right ${statusColors[status]}`}>{temp}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 pt-1 grid grid-cols-2 gap-4 bg-black/20">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-neutral-500 font-bold">
              <span>Position</span>
              <span className="text-emerald-400 font-mono">{value}</span>
            </div>
            <div className="h-12 bg-neutral-900/50 rounded border border-neutral-800/50 flex flex-col p-1">
              <div className="flex-1 flex items-center justify-center">
                <Sparkline data={posHistory} width={140} height={32} color="#10b981" />
              </div>
              {posHistory.length > 0 && (
                <div className="flex justify-between text-[7px] font-mono text-neutral-600 px-1">
                  <span>MIN: {(Math.min(...posHistory) * 180 / Math.PI).toFixed(1)}°</span>
                  <span>MAX: {(Math.max(...posHistory) * 180 / Math.PI).toFixed(1)}°</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-neutral-500 font-bold">
              <span>Torque</span>
              <span className="text-blue-400 font-mono">{torque}</span>
            </div>
            <div className="h-12 bg-neutral-900/50 rounded border border-neutral-800/50 flex flex-col p-1">
              <div className="flex-1 flex items-center justify-center">
                <Sparkline data={torqueHistory} width={140} height={32} color="#3b82f6" />
              </div>
              {torqueHistory.length > 0 && (
                <div className="flex justify-between text-[7px] font-mono text-neutral-600 px-1">
                  <span>MIN: {Math.min(...torqueHistory).toFixed(1)} Nm</span>
                  <span>MAX: {Math.max(...torqueHistory).toFixed(1)} Nm</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
