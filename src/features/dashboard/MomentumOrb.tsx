import { useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface MomentumOrbProps {
  score: number; // 0–100
}

function OrbMesh({ score }: { score: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const t = score / 100; // 0-1

  // Color interpolation: cyan (low) -> violet (mid) -> amber (high)
  const color = useMemo(() => {
    if (t < 0.5) {
      const c = new THREE.Color('#00E5FF').lerp(new THREE.Color('#A855F7'), t * 2);
      return c;
    }
    const c = new THREE.Color('#A855F7').lerp(new THREE.Color('#F97316'), (t - 0.5) * 2);
    return c;
  }, [t]);

  const emissiveColor = useMemo(() => {
    return color.clone().multiplyScalar(0.3);
  }, [color]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * (0.2 + t * 0.3);
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1.2, 64, 64]}>
      <MeshDistortMaterial
        color={color}
        emissive={emissiveColor}
        emissiveIntensity={0.5 + t * 0.5}
        roughness={0.2}
        metalness={0.8}
        distort={0.2 + t * 0.3}
        speed={1 + t * 3}
        transparent
        opacity={0.9}
      />
    </Sphere>
  );
}

function Particles({ score }: { score: number }) {
  const count = Math.floor(10 + (score / 100) * 40);
  const particlesRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 1.5 + Math.random() * 1;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.15;
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#00E5FF"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

export function MomentumOrb({ score }: MomentumOrbProps) {
  return (
    <div className="w-full h-full min-h-[200px] relative">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-surface-2 animate-pulse-glow" />
        </div>
      }>
        <Canvas
          camera={{ position: [0, 0, 4], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <pointLight position={[-3, -3, -3]} intensity={0.4} color="#00E5FF" />
          <OrbMesh score={score} />
          <Particles score={score} />
        </Canvas>
      </Suspense>
      {/* Score overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="font-mono text-3xl font-bold text-text glow-text">{score}</div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted mt-1">Today Score</div>
        </div>
      </div>
    </div>
  );
}
