"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateEmployee } from "@/features/employees";
import { notifyError, notifySuccess } from "@/lib/notify";
import { usePhoto } from "@/hooks/use-photo";


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
