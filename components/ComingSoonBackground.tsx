"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function BackRing() {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.055;
  });
  return (
    <group ref={ref} rotation={[Math.PI / 2.65, 0.35, 0]}>
      <mesh scale={2.35}>
        <torusGeometry args={[1, 0.018, 12, 80]} />
        <meshBasicMaterial color="#C9903A" transparent opacity={0.14} depthWrite={false} />
      </mesh>
    </group>
  );
}

function DistortKnot() {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.07;
      ref.current.rotation.y += delta * 0.11;
    }
  });
  return (
    <group ref={ref}>
      <Float speed={1.75} rotationIntensity={0.32} floatIntensity={0.55}>
        <mesh scale={1.12}>
          <torusKnotGeometry args={[1, 0.26, 120, 28]} />
          <MeshDistortMaterial
            color="#0e0c0a"
            emissive="#C9903A"
            emissiveIntensity={0.38}
            roughness={0.38}
            metalness={0.72}
            distort={0.42}
            speed={1.45}
          />
        </mesh>
      </Float>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.22} />
      <pointLight position={[8, 6, 8]} intensity={14} color="#f0cfa3" />
      <pointLight position={[-7, -5, 5]} intensity={5} color="#3d2415" />
      <BackRing />
      <DistortKnot />
    </>
  );
}

function StaticGlowFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-[42%] h-[min(92vw,640px)] w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-vacayza-amber/20 blur-[100px]" />
      <div className="absolute left-1/2 top-1/2 h-[min(70vw,420px)] w-[min(70vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-vacayza-amber/10 blur-[70px]" />
    </div>
  );
}

export default function ComingSoonBackground() {
  const reducedMotion = usePrefersReducedMotion();

  if (reducedMotion) {
    return <StaticGlowFallback />;
  }

  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: [0, 0, 6.4], fov: 39 }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      }}
      dpr={[1, 2]}
    >
      <Scene />
    </Canvas>
  );
}
