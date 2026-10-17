"use client";

import { Suspense, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Employee } from "@/features/employees";
import { EmployeeInitial } from "@/features/employees";
import { AREAS, type AreaId } from "./areas";
import { OfficeScene } from "./office-scene";
import type { Vec3 } from "./furniture";

type Selection = { kind: "area"; area: AreaId } | { kind: "employee"; employee: Employee; seat: Vec3 } | null;

const LEGEND = [
  { color: "bg-amber-600", label: "Brown Desks - Dev Team" },
  { color: "bg-orange-500", label: "Orange Desks - Design Team" },
  { color: "bg-green-500", label: "Plants & Decoration" },
  { color: "bg-blue-500", label: "Interactive Areas" },
];

/** Bottom-right panel with a close button. */
function InfoPanel({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md rounded-lg p-4 pt-8 text-white max-w-sm"
    >
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-1 right-1 text-gray-300 hover:text-white hover:bg-white/10"
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </Button>
      {children}
    </motion.div>
  );
}

function ControlsHelp() {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-4 left-4 text-white hover:bg-white/20 bg-black/50"
        onClick={() => setVisible(true)}
      >
        Show Controls
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute top-4 left-4 bg-black/50 backdrop-blur-md rounded-lg p-4 text-white max-w-xs"
    >
      <h3 className="font-bold mb-2">Pixel Office Controls</h3>
      <ul className="text-sm space-y-1">
        <li>• Left click + drag: Rotate view</li>
        <li>• Right click + drag: Pan around</li>
        <li>• Scroll: Zoom in/out</li>
        <li>• Click blue cubes: Interact with areas</li>
        <li>• Click employees: Start conversation</li>
      </ul>
      <Button size="sm" variant="ghost" className="mt-2 text-white hover:bg-white/20" onClick={() => setVisible(false)}>
        Hide Controls
      </Button>
    </motion.div>
  );
}

export function Office3D({ employees, count }: { employees: Employee[]; count: number }) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection>(null);
  const close = () => setSelection(null);

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-b from-amber-100 to-orange-200 rounded-lg overflow-hidden">
      <Canvas shadows camera={{ position: [0, 8, 8], fov: 60 }} style={{ width: "100%", height: "100%" }}>
        <Suspense fallback={null}>
          <OfficeScene
            employees={employees}
            selectedSeat={selection?.kind === "employee" ? selection.seat : null}
            onAreaClick={(area) => setSelection({ kind: "area", area })}
            onEmployeeClick={(employee, seat) => setSelection({ kind: "employee", employee, seat })}
          />
        </Suspense>
      </Canvas>

      <ControlsHelp />

      {selection?.kind === "employee" && (
        <InfoPanel onClose={close}>
          <div className="flex items-center mb-3">
            <EmployeeInitial
              name={selection.employee.name}
              className="w-12 h-12 me-3 rounded-lg from-orange-400 to-red-500 text-lg font-bold"
            />
            <div>
              <h3 className="font-bold">{selection.employee.name}</h3>
              <p className="text-sm text-gray-300">{selection.employee.department}</p>
            </div>
          </div>
          {selection.employee.introduction && (
            <p className="text-sm text-gray-300 mb-3">{selection.employee.introduction}</p>
          )}
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            onClick={() => router.push(`/chat?employeeId=${selection.employee.id}`)}
          >
            <MessageSquare className="h-4 w-4 me-2" />
            Start Chat
          </Button>
        </InfoPanel>
      )}

      {selection?.kind === "area" && (
        <InfoPanel onClose={close}>
          <div className="flex items-center mb-2 gap-2">
            {AREAS[selection.area].icon}
            <h3 className="font-bold">{AREAS[selection.area].title}</h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">{AREAS[selection.area].description}</p>
          <div className="space-y-2">
            {AREAS[selection.area].actions.map((action) => (
              <Button key={action} size="sm" variant="outline" className="w-full bg-transparent text-white border-white/30 hover:bg-white/20">
                {action}
              </Button>
            ))}
          </div>
        </InfoPanel>
      )}

      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md rounded-lg p-3 text-white">
        <h4 className="text-sm font-bold mb-2">Office Layout</h4>
        <div className="space-y-1 text-xs">
          {LEGEND.map(({ color, label }) => (
            <div key={label} className="flex items-center">
              <div className={`w-3 h-3 ${color} rounded me-2`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-white/20 text-xs">Employees: {count}</div>
      </div>

      <div className="absolute bottom-4 left-4 flex gap-2">
        <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
          <div className="w-2 h-2 bg-orange-500 rounded-full me-1" />
          Pixel Office Active
        </Badge>
        <Badge variant="secondary" className="bg-green-500/20 text-green-300">
          {count} Employees Online
        </Badge>
      </div>
    </div>
  );
}
