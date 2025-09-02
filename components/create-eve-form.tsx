"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Globe, LogOut, Upload } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

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

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  department: z.string().min(2, { message: "Department must be selected." }),
  introduction: z
    .string()
    .min(10, { message: "Introduction must be at least 10 characters." }),
});

const CreateEveForm = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      department: "",
      introduction: "",
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload a valid image file.",
        variant: "destructive",
      });
      return;
    }

    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    localStorage.removeItem("eveCheckedOnce");
    router.push("/");
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("department", data.department);
      formData.append("introduction", data.introduction);
      if (photoFile) formData.append("photoUrl", photoFile);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/eve-employee`,
        {
          method: "POST",
          headers: {
            authorization: `employee${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result?.error || "Failed to create employee.");
      }

      toast({
        title: "Success",
        description: "Eve Employee created successfully!",
      });

      localStorage.removeItem("allEmployees");
      localStorage.removeItem("myEmployees");
      localStorage.removeItem("countEmployees");
      router.push("/chat-with-eve");
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.message || "There was a problem creating the employee.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-800 py-12 px-4">
      <div className="flex justify-end items-center gap-3 px-4 py-2">
        <Button
          variant="outline"
          onClick={toggleLanguage}
          className="text-sm text-indigo-200 border-indigo-500"
        >
          <Globe className="h-4 w-4 mr-2" />
          {i18n.language === "en" ? "عربي" : "English"}
        </Button>

        <Button
          variant="outline"
          onClick={handleLogout}
          className="text-sm text-red-300 border-red-500"
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>

      <div className="container mx-auto max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => router.push("/home")}
          className="mb-6 text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>
        <Card className="bg-white/10 text-white border-none backdrop-blur-md">
          <CardHeader>
            <CardTitle>{t("createEve.title")}</CardTitle>
            <CardDescription className="text-blue-200">
              {t("createEve.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  {/* Name */}
                  <div>
                    <Label htmlFor="name">{t("createEve.name")}</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder={t("createEve.namePlaceholder")}
                      className="bg-white/20 border-white/30 text-white"
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Department */}
                  <div>
                    <Label htmlFor="department">
                      {t("createEve.department")}
                    </Label>
                    <Controller
                      name="department"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="bg-white/20 border-white/30 text-white">
                            <SelectValue
                              placeholder={t("createEve.departmentPlaceholder")}
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
                      )}
                    />
                    {errors.department && (
                      <p className="text-red-400 text-sm">
                        {errors.department.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-40 h-40 rounded-full overflow-hidden bg-white/20">
                    <Image
                      src={photoUrl || "/placeholder.svg"}
                      alt="Employee"
                      width={160}
                      height={160}
                      className="object-cover w-full h-full"
                      priority
                    />
                  </div>
                  <Label
                    htmlFor="photo"
                    className="bg-white/20 text-white px-4 py-2 rounded-md cursor-pointer flex items-center hover:bg-white/30"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {t("createEve.uploadPhoto")}
                  </Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {photoUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPhotoUrl("");
                        setPhotoFile(null);
                      }}
                      className="text-red-400 hover:text-red-600"
                    >
                      {t("common.delete") || "Remove Photo"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Introduction */}
              <div>
                <Label htmlFor="introduction">
                  {t("createEve.introduction")}
                </Label>
                <Controller
                  name="introduction"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      id="introduction"
                      placeholder={t("createEve.introductionPlaceholder")}
                      rows={5}
                      className="bg-white/20 border-white/30 text-white"
                    />
                  )}
                />
                {errors.introduction && (
                  <p className="text-red-400 text-sm">
                    {errors.introduction.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? t("common.submitting") || "Submitting..."
                  : t("createEve.submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateEveForm;
