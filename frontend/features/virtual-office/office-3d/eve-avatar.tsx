"use client";

import { useRef, useState, type ReactNode } from "react";
import type { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { Box, Text } from "@react-three/drei";
import { STATUS_COLORS } from "@/features/employees";
import type { Employee } from "@/features/employees";
import { Block, type Vec3 } from "./furniture";

// Every EVE employee is an AI assistant.
const BODY_COLOR = "#3B82F6";

interface EveAvatarProps {
  employee: Employee;
  position: Vec3;
  onClick: (employee: Employee) => void;
}

/** An unlit box (eyes, lights, badges) that ignores scene lighting. */
function Glow({ args, position, color, opacity }: { args: Vec3; position: Vec3; color: string; opacity?: number }) {
  return (
    <Box args={args} position={position}>
      <meshBasicMaterial color={color} transparent={opacity !== undefined} opacity={opacity ?? 1} />
    </Box>
  );
}

/** One centered, outlined line of the hover label. */
function LabelLine({ y, size, color, children }: { y: number; size: number; color: string; children: ReactNode }) {
  return (
    <Text
      position={[0, y, 0]}
      fontSize={size}
      maxWidth={1}
      lineHeight={1}
      color={color}
      anchorX="center"
      anchorY="middle"
      outlineWidth={size * 0.03}
      outlineColor="black"
    >
      {children}
    </Text>
  );
}

export function EveAvatar({ employee, position, onClick }: EveAvatarProps) {
  const groupRef = useRef<Group>(null);
  const labelRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const [bobOffset] = useState(() => Math.random() * Math.PI * 2);
  const statusColor = STATUS_COLORS[employee.status] ?? STATUS_COLORS.online;
  const [x, y, z] = position;

  // Gentle bobbing, plus a wiggle while hovered.
  useFrame((state) => {
    const time = state.clock.elapsedTime + bobOffset;
    if (groupRef.current) {
      groupRef.current.position.y = y + 0.5 + Math.sin(time) * 0.02;
      groupRef.current.rotation.y = hovered ? Math.sin(time * 3) * 0.1 : 0;
    }
    if (labelRef.current) {
      labelRef.current.position.y = y + 1.5 + Math.sin(time) * 0.02;
    }
  });

  return (
    <>
      <group
        ref={groupRef}
        position={[x, y + 0.5, z]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onClick(employee)}
      >
        <Block args={[0.3, 0.6, 0.2]} position={[0, 0.3, 0]} color={BODY_COLOR} />
        <Block args={[0.25, 0.25, 0.2]} position={[0, 0.7, 0]} color={BODY_COLOR} />
        <Block args={[0.1, 0.3, 0.1]} position={[-0.08, 0.05, 0]} color={BODY_COLOR} />
        <Block args={[0.1, 0.3, 0.1]} position={[0.08, 0.05, 0]} color={BODY_COLOR} />

        <Glow args={[0.04, 0.04, 0.05]} position={[-0.06, 0.72, 0.1]} color="#000000" />
        <Glow args={[0.04, 0.04, 0.05]} position={[0.06, 0.72, 0.1]} color="#000000" />
        <Glow args={[0.08, 0.08, 0.05]} position={[0.2, 0.8, 0]} color={statusColor} />
        <Glow args={[0.15, 0.05, 0.02]} position={[0, 0.1, 0.15]} color="#FFD700" />

        {hovered && <Glow args={[0.6, 0.02, 0.6]} position={[0, 0.01, 0]} color="#FFD700" opacity={0.4} />}
      </group>

      {hovered && (
        <group ref={labelRef} position={[x, y + 1.5, z]}>
          <LabelLine y={0.4} size={0.14} color="white">
            {employee.name}
          </LabelLine>
          <LabelLine y={0.2} size={0.09} color="#CCCCCC">
            {employee.department ?? ""}
          </LabelLine>
          <LabelLine y={0} size={0.07} color={statusColor}>
            {`AI • ${employee.status}`}
          </LabelLine>
        </group>
      )}
    </>
  );
}
