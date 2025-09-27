import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function CreativeBone() {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.01;
      ref.current.rotation.x = Math.sin(Date.now() * 0.0005) * 0.2;
    }
  });
  return (
    <group ref={ref} position={[0, 1, 0]}>
      {/* Bone shaft */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.25, 2.2, 32]} />
        <meshStandardMaterial color="#fff8dc" metalness={0.2} roughness={0.5} />
      </mesh>
      {/* Bone ends */}
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial color="#fff8dc" metalness={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[0, -1.1, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial color="#fff8dc" metalness={0.2} roughness={0.5} />
      </mesh>
      {/* Decorative rings */}
      <mesh position={[0, 0.7, 0]}>
        <torusGeometry args={[0.32, 0.07, 16, 100]} />
        <meshStandardMaterial color="#00faf3" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.7, 0]}>
        <torusGeometry args={[0.32, 0.07, 16, 100]} />
        <meshStandardMaterial color="#00faf3" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

export default function OceanBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 2, 6], fov: 50 }} shadows>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />
        <CreativeBone />
        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2.1} minPolarAngle={Math.PI / 2.2} />
      </Canvas>
    </div>
  );
} 