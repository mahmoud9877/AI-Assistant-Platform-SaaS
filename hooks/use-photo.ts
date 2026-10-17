"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { notifyError } from "@/lib/notify";

const PHOTO_TYPES = ["image/jpeg", "image/png"];

/** A JPG/PNG chosen from a file input, with a preview URL that is released when replaced. */
export function usePhoto() {
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
