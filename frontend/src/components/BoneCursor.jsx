import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

function CartoonBone() {
  const group = useRef();
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.z = Math.sin(state.clock.getElapsedTime() / 2) * 0.1;
      group.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.08;
    }
  });
  return (
    <group ref={group}>
      {/* Main shaft */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.18, 1.1, 32]} />
        <meshStandardMaterial color="#fff" roughness={0.25} metalness={0.08} />
      </mesh>
      {/* Left end */}
      <mesh position={[-0.55, 0.18, 0]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[-0.55, -0.18, 0]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[-0.75, 0, 0]}>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      {/* Right end */}
      <mesh position={[0.55, 0.18, 0]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[0.55, -0.18, 0]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[0.75, 0, 0]}>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
    </group>
  );
}

const BoneCursor = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [show, setShow] = useState(true);
  const rafRef = useRef();

  useEffect(() => {
    // Hide on touch devices
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      setShow(false);
      return;
    }
    // Hide default cursor
    document.body.style.cursor = 'none';
    // Mouse move handler
    const handleMove = e => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!show) return null;
  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: 9999,
      overflow: 'visible',
    }}>
      <div style={{
        position: 'absolute',
        left: pos.x - 32,
        top: pos.y - 32,
        width: 64,
        height: 64,
        pointerEvents: 'none',
        transition: 'left 0.04s linear, top 0.04s linear',
        willChange: 'left, top',
      }}>
        <Canvas camera={{ position: [0, 0, 2], fov: 50 }} style={{ width: 64, height: 64, background: 'none' }}>
          <ambientLight intensity={1.1} />
          <directionalLight position={[2, 2, 2]} intensity={1.1} />
          <CartoonBone />
        </Canvas>
      </div>
    </div>
  );
};

export default BoneCursor; 