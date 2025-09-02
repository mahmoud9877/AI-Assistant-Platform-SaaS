"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  MessageSquare,
  Search,
  Building,
  MapPin,
  UserCheck,
  Globe,
  ArrowLeft,
  ChevronDown,
  Cuboid as Cube,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Office3DRedesigned from "./office-3d-redesigned";

type EveEmployee = {
  id: number;
  name: string;
  department: string;
  position: string;
  knowledgeText: string;
  status: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  isAI?: boolean;
  introduction?: string;
  role?: string;
};
export const departments = [
  "CF PS HR MFG & Purchases",
  "CF PS MFG EGYPT",
  "Engineering",
  "F&A",
  "FPWH",
  "General Employee",
  "General Operations",
  "GMDSO",
  "HR",
  "HS&E",
  "Human Resources",
  "IWS",
  "Line-1",
  "Line-10",
  "Line-2",
  "Line-9",
  "Marketing",
  "P&E Cairo/Karachi",
  "P&E CFS ENG",
  "PFSS",
  "QA",
  "Regional GMDSO",
  "Regional Tech Pack",
  "RPM WH",
  "Sales",
  "Shave Care Operations",
  "Shave Care Qualilty",
  "Storeroom",
  "TSG Matrix",
  "TSM",
  "Utilities",
];

export default function VirtualOfficeClient() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("office");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    limit: 12,
  });
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [employees, setEmployees] = useState<EveEmployee[]>([]);
  const [countEmployees, setCountEmployees] = useState<EveEmployee[]>([]);

  const [myEmployeeSelected, setMyEmployeesSelected] =
    useState<EveEmployee | null>(null);
  const [myEmployees, setMyEmployees] = useState<EveEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🛠 Helper لتخزين وجلب من الكاش
  const getCachedData = (key: string) => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  };

  const setCachedData = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // 🧑‍💻 1- Fetch My Employees
  const fetchMyEmployees = async (forceRefresh = false) => {
    const token = localStorage.getItem("token");
    const cacheKey = "myEmployees";

    if (!forceRefresh) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setMyEmployees(cached);
        return;
      }
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/eve-employee/my-employee`,
        {
          headers: {
            "Content-Type": "application/json",
            authorization: `employee${token}`,
          },
        }
      );
      const json = await res.json();
      if (json && json.employees) {
        setMyEmployees(json.employees);
        setCachedData(cacheKey, json.employees);
      } else {
        throw new Error(json?.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Failed to fetch my employee:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your employee data",
        variant: "destructive",
      });
    }
  };

  // 👥 2- Fetch Count Employees
  const fetchCountEmployees = async (forceRefresh = false) => {
    const token = localStorage.getItem("token");
    const cacheKey = "countEmployees";

    if (!forceRefresh) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setCountEmployees(cached);
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/eve-employee/all`,
        {
          headers: {
            "Content-Type": "application/json",
            authorization: `employee${token}`,
          },
        }
      );
      const json = await res.json();
      if (json && typeof json.count === "number") {
        setCountEmployees(json.count);
        setCachedData(cacheKey, json.count);
      }
    } catch (error) {
      console.error("Failed to fetch employees count:", error);
      toast({
        title: "Error",
        description: "Failed to fetch employees count",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 📄 3- Fetch All Employees with Pagination
  const fetchAllEmployees = async (page = 1, forceRefresh = false) => {
    const token = localStorage.getItem("token");
    const cacheKey = `employees_page_${page}`;

    if (!forceRefresh) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setEmployees((prev) =>
          page === 1 ? cached.employees : [...prev, ...cached.employees]
        );
        setPagination(cached.pagination);
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/eve-employee?page=${page}&limit=${pagination.limit}`,
        {
          headers: {
            "Content-Type": "application/json",
            authorization: `employee${token}`,
          },
        }
      );
      const json = await res.json();
      if (json && json.employees) {
        setEmployees((prev) =>
          page === 1 ? json.employees : [...prev, ...json.employees]
        );
        setPagination(json.pagination);
        setCachedData(cacheKey, json); // Cache result with pagination
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  // ✅ useEffect on mount
  useEffect(() => {
    fetchAllEmployees();
    fetchMyEmployees();
    fetchCountEmployees();
  }, []);

  const handleSelectMyEmployee = (employee: EveEmployee) => {
    setMyEmployeesSelected(employee);
  };
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!myEmployeeSelected) throw new Error("Employee data not loaded");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/eve-employee/${myEmployeeSelected.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            authorization: `employee${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            name: myEmployeeSelected.name,
            department: myEmployeeSelected.department,
            role: myEmployeeSelected.role,
            status: myEmployeeSelected.status,
          }),
        }
      );

      const json = await res.json();
      if (!json || json.error) {
        throw new Error(json.message || "Failed to update employee");
      }

      await fetchMyEmployees(true);
      await fetchAllEmployees(true);

      toast({
        title: "Profile Updated",
        description:
          "Your virtual office profile has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.department &&
        emp.department.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDepartment =
      selectedDepartment === "All Departments" ||
      emp.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-800">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10 backdrop-blur-sm"
            style={{
              width: Math.random() * 200 + 50,
              height: Math.random() * 200 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative sticky top-0 z-50 bg-gradient-to-r from-[#1e1e3f] via-[#2b254f] to-[#1b1b36] shadow-md p-4 border-b border-white/10 backdrop-blur-md">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">

          {/* Left Section */}
          <div className="flex items-center flex-wrap gap-4">
            <Button
              variant="ghost"
              className="text-white hover:text-indigo-300 hover:bg-white/10 p-2 transition-all duration-200"
              onClick={() => router.push("/home")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Building className="h-6 w-6 text-indigo-400" />
              <h1 className="text-lg md:text-xl font-semibold text-white whitespace-nowrap">
                Pixel Virtual Office
              </h1>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-white hover:text-indigo-300 hover:bg-white/10 transition-all duration-200"
            >
              <Globe className="h-4 w-4 mr-1" />
              {i18n?.language === "en" ? "عربي" : "English"}
            </Button>
            <div className="flex items-center gap-2 text-sm text-indigo-200 whitespace-nowrap">
              {t("virtualOffice.loggedInAs")}:{" "}
              <div className="flex items-center gap-2">
                <img
                  src={user?.avatar || "/default-avatar.png"}
                  alt="user avatar"
                  className="w-6 h-6 rounded-full border border-indigo-300"
                />
                <span className="font-medium text-white">{user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="relative container mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="relative grid w-full grid-cols-4 mb-6 rounded-xl bg-gradient-to-r from-[#2e2e5f] to-[#1e1e3f] border border-white/10 shadow-md overflow-hidden">
            {[
              { value: "office", icon: Cube, label: t("virtualOffice.office") },
              {
                value: "people",
                icon: Users,
                label: t("virtualOffice.employees"),
              },
              {
                value: "profile",
                icon: UserCheck,
                label: t("virtualOffice.profile"),
              },
              {
                value: "departments",
                icon: MapPin,
                label: t("virtualOffice.departments"),
              },
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="w-full h-full flex items-center justify-center text-sm font-medium text-indigo-200 hover:bg-white/10 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-200 ease-in-out"
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="office" className="space-y-6">
            {/* Main Office Card */}
            <Card className="bg-gradient-to-br from-[#1e1e3f] via-[#2e2e5f] to-[#1a1a36] border border-white/10 shadow-lg rounded-xl text-white">
              <CardHeader>
                <CardTitle className="flex items-center text-white text-lg font-semibold">
                  <Cube className="h-5 w-5 mr-2 text-indigo-400" />
                  {t("virtualOffice.pixelArt")}
                </CardTitle>
                <CardDescription className="text-indigo-200 text-sm leading-relaxed">
                  {t("virtualOffice.playNav")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Office3DRedesigned employees={employees} countEmployees={countEmployees} />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Team Status Card */}
              <Card className="bg-gradient-to-br from-[#252547] to-[#1b1b36] border border-white/10 shadow-md rounded-lg text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center text-white font-medium">
                    <Users className="h-4 w-4 mr-2 text-green-400" />
                    {t("virtualOffice.teamStatus")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-indigo-200">
                      {t("virtualOffice.online")}: {countEmployees}
                    </span>
                    <Badge className="bg-green-200/10 text-green-300 border border-green-500/20">
                      {t("virtualOffice.active")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6 mt-6">
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 shadow-lg rounded-2xl">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-gray-900 text-xl font-semibold">
                      {t("virtualOffice.updateYourEmployeeProfile")}
                    </CardTitle>
                    <CardDescription className="text-gray-700 text-sm">
                      {t("virtualOffice.lProfile")}
                    </CardDescription>
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-gray-800 text-white hover:bg-gray-900 transition-all px-4 py-1 rounded-md shadow"
                      >
                        {t("virtualOffice.selectEmployee")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 bg-white text-gray-900 shadow-xl border border-gray-300 rounded-xl">
                      <h4 className="font-semibold mb-3 text-lg">
                        {t("virtualOffice.employeesList")}
                      </h4>
                      <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {myEmployees?.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            {t("virtualOffice.noEmployeesFound")}
                          </p>
                        ) : (
                          myEmployees.map((emp) => (
                            <li
                              key={emp.id}
                              className="cursor-pointer hover:bg-gray-100 p-2 rounded-md border border-gray-200 transition-all"
                              onClick={() => {
                                handleSelectMyEmployee(emp);
                                setMessages([]);
                                toast({
                                  title: `Now editing ${emp.name}'s profile`,
                                });
                              }}
                            >
                              <p className="font-medium text-gray-800">
                                {emp.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {emp.department}
                              </p>
                            </li>
                          ))
                        )}
                      </ul>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Name */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="name"
                      className="text-sm text-gray-800 font-semibold"
                    >
                      {t("createEve.name")}
                    </Label>
                    <Input
                      id="name"
                      required
                      value={myEmployeeSelected?.name || ""}
                      onChange={(e) =>
                        setMyEmployeesSelected((prev) =>
                          prev ? { ...prev, name: e.target.value } : prev
                        )
                      }
                      className="border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 rounded-md"
                      placeholder={t("createEve.name")}
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="department"
                      className="text-sm text-gray-800 font-semibold"
                    >
                      {t("virtualOffice.department")}
                    </Label>
                    <Select
                      value={myEmployeeSelected?.department || ""}
                      onValueChange={(value) =>
                        myEmployeeSelected &&
                        setMyEmployeesSelected({
                          ...myEmployeeSelected,
                          department: value,
                        })
                      }
                    >
                      <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-gray-500 rounded-md">
                        <SelectValue
                          placeholder={t("virtualOffice.departmentPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Role */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="role"
                      className="text-sm text-gray-800 font-semibold"
                    >
                      {t("virtualOffice.role")}
                    </Label>
                    <Input
                      id="role"
                      required
                      value={myEmployeeSelected?.role || ""}
                      onChange={(e) =>
                        myEmployeeSelected &&
                        setMyEmployeesSelected({
                          ...myEmployeeSelected,
                          role: e.target.value,
                        })
                      }
                      className="border-gray-300 focus:ring-2 focus:ring-gray-500 rounded-md"
                      placeholder={t("virtualOffice.exampleRole")}
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="status"
                      className="text-sm text-gray-800 font-semibold"
                    >
                      {t("virtualOffice.status")}
                    </Label>
                    <Select
                      value={myEmployeeSelected?.status || "online"}
                      onValueChange={(value) =>
                        myEmployeeSelected &&
                        setMyEmployeesSelected({
                          ...myEmployeeSelected,
                          status: value,
                        })
                      }
                    >
                      <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-gray-500 rounded-md">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">
                          {t("virtualOffice.online")}
                        </SelectItem>
                        <SelectItem value="away">
                          {t("virtualOffice.away")}
                        </SelectItem>
                        <SelectItem value="busy">
                          {t("virtualOffice.busy")}
                        </SelectItem>
                        <SelectItem value="inMeeting">
                          {t("virtualOffice.inMeeting")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-md transition-all flex items-center justify-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 mr-2 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          />
                        </svg>
                        {t("virtualOffice.updatingProfile")}
                      </>
                    ) : (
                      `${t("virtualOffice.updateProfile")}`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="people" className="space-y-6">
            {/* Filter Section */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  placeholder={t("virtualOffice.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-gray-500"
                />
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full md:w-[200px] border-gray-300">
                  <SelectValue placeholder={t("virtualOffice.allDepartments")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Departments">{t("virtualOffice.allDepartments")}</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employees Grid */}
            <ScrollArea className="h-[600px] pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.map((employee) => (
                  <Card
                    key={employee.id}
                    className="bg-gradient-to-br from-white to-gray-50 border border-gray-300 shadow-sm rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
                    onClick={() => router.push(`/chat?employeeId=${employee.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                          <span className="text-white font-semibold">{employee.name.charAt(0)}</span>
                        </div>
                        <div>
                          <CardTitle className="text-sm text-gray-800 font-medium truncate">{employee.name}</CardTitle>
                          <CardDescription className="text-gray-600 text-xs truncate">{employee.department}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/chat?employeeId=${employee.id}`);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>

                      {employee.introduction && (
                        <p className="text-xs text-gray-600 mt-1 break-words">{employee.introduction}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {pagination.totalPages > pagination.page && (
              <div className="flex justify-center mt-4">
                <Button
                  onClick={() => fetchAllEmployees(pagination.page + 1)}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  {t("virtualOffice.loadMoreEmployees")}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}

          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept) => {
                const deptEmployees = employees.filter(
                  (emp) => emp.department === dept
                );

                return (
                  <Card
                    key={dept}
                    className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-md rounded-xl transition hover:shadow-lg"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-gray-800">
                        {dept}
                      </CardTitle>
                      <CardDescription className="text-gray-500 text-sm">
                        {deptEmployees.length}{" "}
                        {deptEmployees.length === 1 ? "employee" : "employees"}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        {/* Employee initials */}
                        <div className="flex -space-x-2 overflow-hidden">
                          {deptEmployees.slice(0, 3).map((emp) => (
                            <div
                              key={emp.id}
                              className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-white flex items-center justify-center text-sm font-semibold text-white shadow"
                              title={emp.name}
                            >
                              {emp.name.charAt(0)}
                            </div>
                          ))}

                          {deptEmployees.length > 3 && (
                            <div className="w-9 h-9 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-sm font-semibold text-white shadow">
                              +{deptEmployees.length - 3}
                            </div>
                          )}
                        </div>

                        {/* View Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-sm text-gray-700 hover:text-white hover:bg-gradient-to-r from-gray-700 to-gray-900 px-3 py-1 rounded transition-all"
                          onClick={() => {
                            setSelectedDepartment(dept);
                            setActiveTab("people");
                          }}
                        >
                          {t("virtualOffice.view")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
