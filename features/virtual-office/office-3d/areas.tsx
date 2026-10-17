import type { ReactNode } from "react";
import { Coffee, MonitorIcon, Users } from "lucide-react";
import type { Vec3 } from "./furniture";

export type AreaId = "dev" | "design" | "qa" | "meeting" | "break" | "reception";

export interface Area {
  title: string;
  description: string;
  icon?: ReactNode;
  actions: string[];
  /** Where the hotspot cube floats in the scene. */
  hotspot: Vec3;
}

export const AREAS: Record<AreaId, Area> = {
  dev: {
    title: "Development Team",
    description: "Software development workstations with brown desks",
    icon: <MonitorIcon className="h-5 w-5" />,
    actions: ["Join Team", "View Projects", "Code Review"],
    hotspot: [-6, 1.5, -4],
  },
  design: {
    title: "Design Team",
    description: "UI/UX design workstations with orange desks",
    icon: <MonitorIcon className="h-5 w-5" />,
    actions: ["Join Team", "View Designs", "Collaborate"],
    hotspot: [0, 1.5, -4],
  },
  qa: {
    title: "QA Team",
    description: "Quality assurance workstation",
    icon: <MonitorIcon className="h-5 w-5" />,
    actions: ["Join Team", "View Tests", "Report Issues"],
    hotspot: [6, 1.5, -4],
  },
  meeting: {
    title: "Meeting Room",
    description: "Conference room for team meetings",
    actions: ["Join Meeting", "Schedule Meeting", "View Calendar"],
    hotspot: [5, 1.5, 4],
  },
  break: {
    title: "Break Area",
    description: "Coffee, water cooler, and printer area",
    icon: <Coffee className="h-5 w-5" />,
    actions: ["Get Coffee", "Print Documents", "Take a Break"],
    hotspot: [7.5, 1.5, -7],
  },
  reception: {
    title: "Reception",
    description: "Main entrance and information desk",
    icon: <Users className="h-5 w-5" />,
    actions: ["Check In", "Get Information", "Directory"],
    hotspot: [-7, 1.5, -7],
  },
};

/** Seats employees are placed at, in order; extra employees reuse them. */
export const SEATS: Vec3[] = [
  [-6, 0, -2],
  [-3, 0, -2],
  [0, 0, -2],
  [3, 0, -2],
  [6, 0, -2],
  [-4.5, 0, 2],
  [-2, 0, 7.5],
  [4, 0, 3],
  [6, 0, 5],
  [-6.3, 0, -6.3],
];
