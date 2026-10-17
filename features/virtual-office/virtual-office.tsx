"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Building, Cuboid, MapPin, UserCheck, Users } from "lucide-react";
import { useAuthStore } from "@/features/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedBackground } from "@/components/layout/animated-background";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { BackLink } from "@/components/shared/back-link";
import { EmployeeInitial } from "@/features/employees";
import { ALL_DEPARTMENTS } from "@/features/departments";
import { useVirtualOffice } from "./use-virtual-office";
import { OfficeTab } from "./tabs/office-tab";
import { PeopleTab } from "./tabs/people-tab";
import { ProfileTab } from "./tabs/profile-tab";
import { DepartmentsTab } from "./tabs/departments-tab";

type Tab = "office" | "people" | "profile" | "departments";

function OfficeHeader() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-[#1e1e3f] via-[#2b254f] to-[#1b1b36] shadow-md p-4 border-b border-white/10 backdrop-blur-md">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BackLink href="/home" className="hover:text-indigo-300 p-2" />
          <div className="flex items-center gap-2">
            <Building className="h-6 w-6 text-indigo-400" />
            <h1 className="text-lg md:text-xl font-semibold text-white whitespace-nowrap">Pixel Virtual Office</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <LanguageToggle className="border-transparent" />
          <div className="flex items-center gap-2 text-sm text-indigo-200 whitespace-nowrap">
            {t("virtualOffice.loggedInAs")}:
            <EmployeeInitial name={user?.name ?? user?.email} className="w-6 h-6 rounded-full text-xs" />
            <span className="font-medium text-white">{user?.name ?? user?.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VirtualOffice() {
  const { t } = useTranslation();
  const office = useVirtualOffice();
  const [activeTab, setActiveTab] = useState<Tab>("office");
  const [department, setDepartment] = useState<string>(ALL_DEPARTMENTS);

  const tabs = [
    { value: "office", icon: Cuboid, label: t("virtualOffice.office") },
    { value: "people", icon: Users, label: t("virtualOffice.employees") },
    { value: "profile", icon: UserCheck, label: t("virtualOffice.profile") },
    { value: "departments", icon: MapPin, label: t("virtualOffice.departments") },
  ] as const;

  return (
    <div className="min-h-screen relative overflow-hidden bg-eve">
      <AnimatedBackground />
      <OfficeHeader />

      <div className="relative container mx-auto p-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)} className="w-full">
          <TabsList className="grid w-full h-auto grid-cols-2 md:grid-cols-4 mb-6 rounded-xl bg-gradient-to-r from-[#2e2e5f] to-[#1e1e3f] border border-white/10 shadow-md overflow-hidden">
            {tabs.map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="w-full h-full flex items-center justify-center text-sm font-medium text-indigo-200 hover:bg-white/10 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
              >
                <Icon className="h-4 w-4 me-2" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="office" className="space-y-6">
            <OfficeTab employees={office.employees} count={office.count} />
          </TabsContent>

          <TabsContent value="people" className="space-y-6">
            <PeopleTab
              employees={office.employees}
              department={department}
              onDepartmentChange={setDepartment}
              hasMore={office.hasMore}
              isLoading={office.isLoading}
              onLoadMore={office.loadMore}
            />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6 mt-6">
            <ProfileTab myEmployees={office.myEmployees} />
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <DepartmentsTab
              employees={office.employees}
              onView={(dept) => {
                setDepartment(dept);
                setActiveTab("people");
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
