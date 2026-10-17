"use client";

import { useTranslation } from "react-i18next";
import { Cuboid, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Office3D } from "../office-3d/office-3d";
import type { Employee } from "@/features/employees";

export function OfficeTab({ employees, count }: { employees: Employee[]; count: number }) {
  const { t } = useTranslation();

  return (
    <>
      <Card className="bg-gradient-to-br from-[#1e1e3f] via-[#2e2e5f] to-[#1a1a36] border border-white/10 shadow-lg rounded-xl text-white">
        <CardHeader>
          <CardTitle className="flex items-center text-white text-lg font-semibold">
            <Cuboid className="h-5 w-5 me-2 text-indigo-400" />
            {t("virtualOffice.pixelArt")}
          </CardTitle>
          <CardDescription className="text-indigo-200 text-sm leading-relaxed">
            {t("virtualOffice.playNav")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Office3D employees={employees} count={count} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[#252547] to-[#1b1b36] border border-white/10 shadow-md rounded-lg text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center text-white font-medium">
              <Users className="h-4 w-4 me-2 text-green-400" />
              {t("virtualOffice.teamStatus")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-indigo-200">
                {t("virtualOffice.online")}: {count}
              </span>
              <Badge className="bg-green-200/10 text-green-300 border border-green-500/20">
                {t("virtualOffice.active")}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
