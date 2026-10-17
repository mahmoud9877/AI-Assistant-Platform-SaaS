"use client";

import { Fragment, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Box, Cylinder, OrbitControls } from "@react-three/drei";
import type { Employee } from "@/features/employees";
import { AREAS, SEATS, type AreaId } from "./areas";
import { EveAvatar } from "./eve-avatar";
import {
  COLORS,
  OfficeEquipment,
  PixelChair,
  PixelDesk,
  PixelHotspot,
  PixelMeetingTable,
  PixelMonitor,
  PixelPlant,
  WaterCooler,
  type Vec3,
} from "./furniture";

const FRONT_ROW: { x: number; variant: "standard" | "orange" }[] = [
  { x: -6, variant: "standard" },
  { x: -3, variant: "standard" },
  { x: 0, variant: "orange" },
  { x: 3, variant: "orange" },
  { x: 6, variant: "standard" },
];

const MEETING_CHAIRS: { position: Vec3; rotation: Vec3 }[] = [
  { position: [3.5, 0, 3], rotation: [0, Math.PI / 2, 0] },
  { position: [6.5, 0, 3], rotation: [0, -Math.PI / 2, 0] },
  { position: [3.5, 0, 5], rotation: [0, Math.PI / 2, 0] },
  { position: [6.5, 0, 5], rotation: [0, -Math.PI / 2, 0] },
  { position: [5, 0, 2.2], rotation: [0, 0, 0] },
  { position: [5, 0, 5.8], rotation: [0, Math.PI, 0] },
];

const PLANTS: { position: Vec3; size: "small" | "large" }[] = [
  { position: [-8, 0, -2], size: "large" },
  { position: [8, 0, -2], size: "large" },
  { position: [-1, 0, -7], size: "small" },
  { position: [1, 0, -7], size: "small" },
  { position: [-4, 0, 8], size: "small" },
  { position: [2, 0, 8], size: "small" },
];

export const seatFor = (index: number): Vec3 => SEATS[index % SEATS.length];

function Room() {
  return (
    <>
      <Box args={[20, 0.1, 20]} position={[0, -0.05, 0]}>
        <meshLambertMaterial color={COLORS.floor} />
      </Box>
      {(
        [
          { args: [20, 3, 0.2], position: [0, 1.5, -10] },
          { args: [0.2, 3, 20], position: [-10, 1.5, 0] },
          { args: [20, 3, 0.2], position: [0, 1.5, 10] },
          { args: [0.2, 3, 20], position: [10, 1.5, 0] },
        ] as { args: Vec3; position: Vec3 }[]
      ).map((wall) => (
        <Box key={wall.position.join(",")} args={wall.args} position={wall.position}>
          <meshLambertMaterial color={COLORS.wall} />
        </Box>
      ))}
    </>
  );
}

function Furniture() {
  return (
    <>
      {FRONT_ROW.map(({ x, variant }) => (
        <Fragment key={x}>
          <PixelDesk position={[x, 0, -4]} variant={variant} />
          <PixelChair position={[x, 0, -2.5]} rotation={[0, Math.PI, 0]} />
          <PixelMonitor position={[x, 0.9, -4.3]} />
        </Fragment>
      ))}

      <PixelMeetingTable position={[5, 0, 4]} />
      {MEETING_CHAIRS.map((chair) => (
        <PixelChair key={chair.position.join(",")} {...chair} />
      ))}

      {/* Break area */}
      <OfficeEquipment position={[7, 0, -7]} type="coffee" />
      <OfficeEquipment position={[8, 0, -6]} type="printer" />
      <WaterCooler position={[8, 0, -8]} />

      {/* Reception */}
      <PixelDesk position={[-7, 0, -7]} rotation={[0, Math.PI / 4, 0]} />
      <PixelChair position={[-6.3, 0, -6.3]} rotation={[0, Math.PI / 4, 0]} />
      <PixelMonitor position={[-7.3, 0.9, -7.3]} rotation={[0, Math.PI / 4, 0]} />

      {/* Extra workstations */}
      <PixelDesk position={[-6, 0, 2]} rotation={[0, Math.PI / 2, 0]} />
      <PixelChair position={[-4.5, 0, 2]} rotation={[0, -Math.PI / 2, 0]} />
      <PixelMonitor position={[-6.3, 0.9, 2]} rotation={[0, Math.PI / 2, 0]} />

      <PixelDesk position={[-2, 0, 6]} />
      <PixelChair position={[-2, 0, 7.5]} rotation={[0, Math.PI, 0]} />
      <PixelMonitor position={[-2, 0.9, 5.7]} />

      {PLANTS.map((plant) => (
        <PixelPlant key={plant.position.join(",")} {...plant} />
      ))}
    </>
  );
}

interface OfficeSceneProps {
  employees: Employee[];
  selectedSeat: Vec3 | null;
  onAreaClick: (area: AreaId) => void;
  onEmployeeClick: (employee: Employee, seat: Vec3) => void;
}

export function OfficeScene({ employees, selectedSeat, onAreaClick, onEmployeeClick }: OfficeSceneProps) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 8, 8);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <pointLight position={[0, 5, 0]} intensity={0.4} />

      <Room />
      <Furniture />

      {(Object.keys(AREAS) as AreaId[]).map((id) => (
        <PixelHotspot key={id} position={AREAS[id].hotspot} label={AREAS[id].title} onClick={() => onAreaClick(id)} />
      ))}

      {employees.map((employee, index) => {
        const seat = seatFor(index);
        return (
          <EveAvatar
            key={employee.id}
            employee={employee}
            position={seat}
            onClick={() => onEmployeeClick(employee, seat)}
          />
        );
      })}

      {/* Glowing disk under the selected employee */}
      {selectedSeat && (
        <Cylinder args={[0.6, 0.6, 0.02, 24]} position={[selectedSeat[0], 0.01, selectedSeat[2]]}>
          <meshStandardMaterial color="#00BFFF" emissive="#00BFFF" emissiveIntensity={0.8} transparent opacity={0.6} />
        </Cylinder>
      )}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={0.2}
        target={[0, 0, 0]}
      />
    </>
  );
}
