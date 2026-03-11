import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Settings2, User, Grid3X3, Layers, Navigation } from 'lucide-react';

interface LidarMapProps {
  points: number[][]; // [x, y] or [x, y, z]
  robotPose?: { x: number, y: number, yaw: number };
  trajectory?: { x: number, y: number }[];
}

const AnimatedRobot = ({ pose, visible }: { pose: { x: number, y: number, yaw: number }, visible: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const scannerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!visible) return;
    
    const time = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Enhanced bobbing with secondary oscillation for "hover" feel
      groupRef.current.position.y = Math.sin(time * 2.5) * 0.1 + Math.sin(time * 5) * 0.02;
    }
    
    if (scannerRef.current) {
      // Rotating scanner beam
      scannerRef.current.rotation.y = time * 2;
      scannerRef.current.scale.set(1 + Math.sin(time * 4) * 0.1, 1, 1);
    }
    
    if (glowRef.current) {
      // Pulsing glow with "heartbeat" rhythm
      const pulse = Math.sin(time * 3) * 0.5 + Math.sin(time * 6) * 0.2;
      const scale = 1.2 + pulse * 0.3;
      glowRef.current.scale.set(scale, scale, scale);
      if (glowRef.current.material instanceof THREE.MeshBasicMaterial) {
        glowRef.current.material.opacity = 0.1 + pulse * 0.05;
      }
    }

    if (ringRef.current) {
      // Expanding ring effect with faster cycle
      const ringScale = (time * 2) % 4;
      ringRef.current.scale.set(ringScale, ringScale, ringScale);
      if (ringRef.current.material instanceof THREE.MeshBasicMaterial) {
        ringRef.current.material.opacity = Math.max(0, 0.3 * (1 - ringScale / 4));
      }
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={[pose.x, 0, pose.y]} rotation={[0, -pose.yaw, 0]}>
      {/* Expanding Pulse Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <ringGeometry args={[0.8, 0.85, 64]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.2} />
      </mesh>

      {/* Static/Pulsing Glow Effect */}
      <mesh ref={glowRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <circleGeometry args={[1.5, 64]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.05} />
      </mesh>

      {/* Robot Body Indicator (Cone) */}
      <mesh>
        <coneGeometry args={[0.2, 0.5, 3]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Scanner Beam */}
      <mesh ref={scannerRef} position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.01, 0.8, 0.05, 32, 1, true, 0, Math.PI / 4]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Directional Base */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 32]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.4} />
      </mesh>
    </group>
  );
};

const AnimatedLidarPoints = ({ geometry, pointSize }: { geometry: THREE.BufferGeometry, pointSize: number }) => {
  const materialRef = useRef<THREE.PointsMaterial>(null);
  
  // Create a simple circular texture for the points
  const circleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (materialRef.current) {
      // "Digital" pulsing effect - faster and more dynamic
      const pulse = Math.sin(time * 5) * 0.5 + 0.5;
      const flicker = Math.random() > 0.98 ? 0.2 : 0; // Occasional flicker
      
      materialRef.current.opacity = (0.3 + pulse * 0.4) - flicker;
      materialRef.current.size = pointSize + pulse * 0.03;
      
      // Subtle color shift to indicate "active" state
      const hue = 150 + Math.sin(time * 2) * 10; // Shift around emerald
      materialRef.current.color.setHSL(hue / 360, 0.8, 0.5);
    }
  });

  return (
    <points geometry={geometry}>
      <pointsMaterial 
        ref={materialRef} 
        color="#10b981" 
        size={0.08} 
        sizeAttenuation={true} 
        transparent={true}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        map={circleTexture}
      />
    </points>
  );
};

const TrajectoryLine = ({ points, visible }: { points: { x: number, y: number }[], visible: boolean }) => {
  const pathPoints = useMemo(() => {
    return points.map(p => new THREE.Vector3(p.x, 0.01, p.y));
  }, [points]);

  if (!visible || pathPoints.length < 2) return null;

  return (
    <Line
      points={pathPoints}
      color="#ef4444"
      lineWidth={2}
      transparent
      opacity={0.6}
    />
  );
};

export const LidarMap = ({ points, robotPose = { x: 0, y: 0, yaw: 0 }, trajectory = [] }: LidarMapProps) => {
  const [showRobot, setShowRobot] = useState(true);
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [showFineGrid, setShowFineGrid] = useState(true);
  const [showSectionGrid, setShowSectionGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [pointSize, setPointSize] = useState(0.08);
  const [showControls, setShowControls] = useState(false);

  const lidarGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const normalizedPoints = points.map((point) => {
      if (point.length >= 3) {
        return [point[0], point[1], point[2]];
      }

      // Allow 2D points ([x, y]) by projecting them to the ground plane.
      return [point[0] ?? 0, 0, point[1] ?? 0];
    });

    const vertices = new Float32Array(normalizedPoints.flat());
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geometry;
  }, [points]);

  return (
    <div className="w-full h-full bg-[#050505] relative group/map">
      <Canvas 
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ position: [0, 10, 0], fov: 50 }}
        gl={{ 
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
          depth: true
        }}
      >
        <color attach="background" args={['#050505']} />
        
        {/* Lidar Points */}
        {showPoints && (
          <AnimatedLidarPoints geometry={lidarGeometry} pointSize={pointSize} />
        )}

        {/* Robot Indicator */}
        <AnimatedRobot pose={robotPose} visible={showRobot} />

        {/* Trajectory Line */}
        <TrajectoryLine points={trajectory} visible={showTrajectory} />

        {/* Enhanced Floor Grid */}
        <group position={[0, -0.01, 0]}>
          {/* Primary Fine Grid */}
          {showFineGrid && (
            <Grid 
              infiniteGrid 
              fadeDistance={40} 
              fadeStrength={3} 
              cellSize={0.5} 
              cellThickness={0.5}
              cellColor="#111" 
              sectionSize={0}
            />
          )}
          {/* Secondary Section Grid */}
          {showSectionGrid && (
            <Grid 
              infiniteGrid 
              fadeDistance={50} 
              fadeStrength={5} 
              cellSize={2.5} 
              cellThickness={1}
              cellColor="#222" 
              sectionSize={12.5}
              sectionThickness={1.5}
              sectionColor="#333"
            />
          )}
          {/* Subtle Floor Plane for depth */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
            <planeGeometry args={[100, 100]} />
            <meshBasicMaterial color="#050505" transparent opacity={0.5} />
          </mesh>
          
          {/* Axis Indicators */}
          {showAxes && (
            <>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
                <planeGeometry args={[100, 0.02]} />
                <meshBasicMaterial color="#ef4444" transparent opacity={0.1} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, -0.015, 0]}>
                <planeGeometry args={[100, 0.02]} />
                <meshBasicMaterial color="#3b82f6" transparent opacity={0.1} />
              </mesh>
            </>
          )}
        </group>
        
        <OrbitControls 
          enableRotate={false} 
          enablePan={true} 
          screenSpacePanning={true}
          minDistance={2}
          maxDistance={50}
        />
      </Canvas>

      {/* Legend Overlay */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 flex flex-col gap-1 pointer-events-none">
          {showRobot && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">Robot Pose (/odom)</span>
            </div>
          )}
          {showPoints && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">Lidar Scan (/scan)</span>
            </div>
          )}
        </div>
      )}

      {/* Visibility Controls */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        <button 
          onClick={() => setShowControls(!showControls)}
          className={`p-2 rounded-lg backdrop-blur-md border transition-all ${showControls ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-black/40 border-neutral-800 text-neutral-500 hover:text-neutral-300'}`}
          title="Map Settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>

        {showControls && (
          <div className="bg-black/80 backdrop-blur-xl border border-neutral-800 rounded-xl p-3 flex flex-col gap-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 min-w-[180px]">
            <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1 px-1 flex justify-between items-center">
              <span>Visualization</span>
              <span className="text-[8px] opacity-50 font-normal">Toggles</span>
            </div>
            
            <button 
              onClick={() => setShowRobot(!showRobot)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all text-[10px] font-medium ${showRobot ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-neutral-500 hover:bg-white/5 border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <User className="w-3.5 h-3.5" />
                <span>Robot Indicator</span>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${showRobot ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-neutral-700'}`} />
            </button>

            <button 
              onClick={() => setShowTrajectory(!showTrajectory)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all text-[10px] font-medium ${showTrajectory ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-neutral-500 hover:bg-white/5 border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <Navigation className="w-3.5 h-3.5" />
                <span>Trajectory Path</span>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${showTrajectory ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-neutral-700'}`} />
            </button>

            <button 
              onClick={() => setShowPoints(!showPoints)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all text-[10px] font-medium ${showPoints ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-neutral-500 hover:bg-white/5 border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center">
                  <div className="w-1 h-1 bg-current rounded-full" />
                </div>
                <span>Lidar Points</span>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${showPoints ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-neutral-700'}`} />
            </button>

            <div className="h-px bg-neutral-800 my-1 mx-1" />

            <button 
              onClick={() => setShowFineGrid(!showFineGrid)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all text-[10px] font-medium ${showFineGrid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-neutral-500 hover:bg-white/5 border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>Fine Grid (0.5m)</span>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${showFineGrid ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-neutral-700'}`} />
            </button>

            <button 
              onClick={() => setShowSectionGrid(!showSectionGrid)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all text-[10px] font-medium ${showSectionGrid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-neutral-500 hover:bg-white/5 border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <Layers className="w-3.5 h-3.5" />
                <span>Section Grid (2.5m)</span>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${showSectionGrid ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-neutral-700'}`} />
            </button>

            <button 
              onClick={() => setShowAxes(!showAxes)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all text-[10px] font-medium ${showAxes ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-neutral-500 hover:bg-white/5 border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 flex items-center justify-center">
                  <div className="w-full h-px bg-current opacity-50" />
                  <div className="h-full w-px bg-current opacity-50 absolute" />
                </div>
                <span>Axis Indicators</span>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${showAxes ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-neutral-700'}`} />
            </button>

            <button 
              onClick={() => setShowLegend(!showLegend)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all text-[10px] font-medium ${showLegend ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-neutral-500 hover:bg-white/5 border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 flex items-center justify-center border border-current rounded-sm">
                  <div className="w-1.5 h-1.5 bg-current opacity-50" />
                </div>
                <span>Map Legend</span>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${showLegend ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-neutral-700'}`} />
            </button>

            <div className="h-px bg-neutral-800 my-1 mx-1" />

            <div className="px-3 py-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-medium text-neutral-400">Point Size</span>
                <span className="text-[9px] font-mono text-emerald-500">{(pointSize * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" 
                min="0.02" 
                max="0.2" 
                step="0.01" 
                value={pointSize}
                onChange={(e) => setPointSize(parseFloat(e.target.value))}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
