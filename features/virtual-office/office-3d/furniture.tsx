"use client";

import { useRef, useState } from "react";
import type { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard, Box, Cylinder, Text } from "@react-three/drei";

export type Vec3 = [number, number, number];

// Pixel-style colors
export const COLORS = {
  floor: "#D4C4A8",
  wall: "#B8A888",
  desk: "#8B4513",
  deskAlt: "#CD853F",
  chair: "#654321",
  computer: "#2F2F2F",
  screen: "#4169E1",
  plant: "#228B22",
  pot: "#8B4513",
  meeting: "#A0522D",
  equipment: "#696969",
};

interface Placed {
  position: Vec3;
  rotation?: Vec3;
}

/** A box with a flat Lambert color — the building block of every prop. */
export function Block({ args, position, color }: { args: Vec3; position: Vec3; color: string }) {
  return (
    <Box args={args} position={position}>
      <meshLambertMaterial color={color} />
    </Box>
  );
}

/** Four legs at (±x, ±z). */
function Legs({ x, z, size, height, color }: { x: number; z: number; size: number; height: number; color: string }) {
  const corners: [number, number][] = [
    [-x, -z],
    [x, -z],
    [-x, z],
    [x, z],
  ];
  return (
    <>
      {corners.map(([lx, lz]) => (
        <Block key={`${lx},${lz}`} args={[size, height, size]} position={[lx, height / 2, lz]} color={color} />
      ))}
    </>
  );
}

export function PixelDesk({ position, rotation = [0, 0, 0], variant = "standard" }: Placed & { variant?: "standard" | "orange" }) {
  const color = variant === "orange" ? COLORS.deskAlt : COLORS.desk;
  return (
    <group position={position} rotation={rotation}>
      <Block args={[2, 0.15, 1.2]} position={[0, 0.75, 0]} color={color} />
      <Block args={[1.8, 0.6, 1]} position={[0, 0.4, 0]} color={color} />
      <Legs x={0.8} z={0.4} size={0.15} height={0.7} color={color} />
    </group>
  );
}

export function PixelChair({ position, rotation = [0, 0, 0] }: Placed) {
  return (
    <group position={position} rotation={rotation}>
      <Block args={[0.5, 0.1, 0.5]} position={[0, 0.5, 0]} color={COLORS.chair} />
      <Block args={[0.5, 0.6, 0.1]} position={[0, 0.8, -0.2]} color={COLORS.chair} />
      <Legs x={0.2} z={0.2} size={0.1} height={0.5} color={COLORS.chair} />
    </group>
  );
}

export function PixelMonitor({ position, rotation = [0, 0, 0] }: Placed) {
  return (
    <group position={position} rotation={rotation}>
      <Block args={[0.7, 0.5, 0.1]} position={[0, 0.25, 0]} color={COLORS.computer} />
      <Box args={[0.6, 0.4, 0.05]} position={[0, 0.25, 0.05]}>
        <meshBasicMaterial color={COLORS.screen} />
      </Box>
      <Block args={[0.15, 0.3, 0.15]} position={[0, -0.05, 0]} color={COLORS.computer} />
      <Block args={[0.4, 0.05, 0.3]} position={[0, -0.2, 0]} color={COLORS.computer} />
    </group>
  );
}

export function PixelPlant({ position, size = "small" }: { position: Vec3; size?: "small" | "large" }) {
  const leaves = size === "large" ? 0.4 : 0.25;
  const pot: Vec3 = size === "large" ? [0.2, 0.3, 0.2] : [0.15, 0.2, 0.15];
  return (
    <group position={position}>
      <Block args={pot} position={[0, pot[1] / 2, 0]} color={COLORS.pot} />
      <Block args={[leaves, leaves, leaves]} position={[0, pot[1] + leaves / 2, 0]} color={COLORS.plant} />
    </group>
  );
}

export function PixelMeetingTable({ position, rotation = [0, 0, 0] }: Placed) {
  return (
    <group position={position} rotation={rotation}>
      <Block args={[3, 0.15, 2]} position={[0, 0.75, 0]} color={COLORS.meeting} />
      <Legs x={1.2} z={0.8} size={0.2} height={0.7} color={COLORS.meeting} />
    </group>
  );
}

export function OfficeEquipment({ position, type }: { position: Vec3; type: "printer" | "coffee" }) {
  if (type === "printer") {
    return (
      <group position={position}>
        <Block args={[0.6, 0.4, 0.5]} position={[0, 0.2, 0]} color={COLORS.equipment} />
        <Block args={[0.5, 0.1, 0.4]} position={[0, 0.42, 0]} color="#FFFFFF" />
      </group>
    );
  }
  return (
    <group position={position}>
      <Block args={[0.4, 0.7, 0.4]} position={[0, 0.35, 0]} color={COLORS.equipment} />
      <Block args={[0.2, 0.15, 0.15]} position={[0, 0.5, 0.2]} color="#000000" />
    </group>
  );
}

export function WaterCooler({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <Block args={[0.4, 0.8, 0.4]} position={[0, 0.4, 0]} color="#FFFFFF" />
      <Cylinder args={[0.15, 0.15, 0.4, 8]} position={[0, 1, 0]}>
        <meshLambertMaterial color="#87CEEB" />
      </Cylinder>
    </group>
  );
}

/** A spinning cube that shows a label on hover and opens an area panel on click. */
export function PixelHotspot({ position, label, onClick }: { position: Vec3; label: string; onClick: () => void }) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    meshRef.current.scale.setScalar(hovered ? 1.1 : 1);
  });

  return (
    <group position={position}>
      <Box
        ref={meshRef}
        args={[0.15, 0.15, 0.15]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClick}
      >
        <meshBasicMaterial color={hovered ? "#FFD700" : "#00BFFF"} transparent opacity={0.7} />
      </Box>
      {hovered && (
        <Billboard position={[0, 0.4, 0]}>
          <Text fontSize={0.12} color="white" anchorX="center" anchorY="middle">
            {label}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
