"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateEmployee } from "@/features/employees";
import { notifyError, notifySuccess } from "@/lib/notify";

const PHOTO_TYPES = ["image/jpeg", "image/png"];

// Limits match the backend's validation.
const createEveSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters." })
    .max(20, { message: "Name must be at most 20 characters." }),
  // A department id from the select.
  departmentId: z.string({ required_error: "Department must be selected." }).min(1, { message: "Department must be selected." }),
  introduction: z
    .string()
    .trim()
    .min(10, { message: "Introduction must be at least 10 characters." })
    .max(2000, { message: "Introduction must be at most 2000 characters." }),
});

export type CreateEveValues = z.infer<typeof createEveSchema>;

/** Image chosen for the new EVE, with a preview URL that is released when replaced. */
function usePhoto() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!file) return setPreview("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const choose = (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    e.target.value = "";
    if (!chosen) return;
    if (!PHOTO_TYPES.includes(chosen.type)) {
      notifyError("Invalid file", "Please upload a JPG or PNG image.");
      return;
    }
    setFile(chosen);
  };

  return { file, preview, accept: PHOTO_TYPES.join(","), choose, clear: () => setFile(null) };
}

/** Form state, validation, photo and submission for creating an EVE employee. */
export function useCreateEveForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const photo = usePhoto();
  const createEmployee = useCreateEmployee();
  const form = useForm<CreateEveValues>({
    resolver: zodResolver(createEveSchema),
    defaultValues: { name: "", introduction: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    const data = new FormData();
    data.append("name", values.name);
    data.append("departmentId", values.departmentId);
    data.append("introduction", values.introduction);
    if (photo.file) data.append("photoUrl", photo.file);

    try {
      await createEmployee.mutateAsync(data);
      notifySuccess(t("createEve.success"), t("createEve.successDesc"));
      router.push("/chat-with-eve");
    } catch (err) {
      notifyError(t("createEve.error"), err);
    }
  });

  return { form, photo, submit };
}
