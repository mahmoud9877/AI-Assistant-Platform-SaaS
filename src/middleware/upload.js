import fs from "fs";
import path from "path";
import multer from "multer";
import env from "../config/env.js";
import { AppError } from "../utils/app-error.js";

if (!env.isVercel) {
  fs.mkdirSync(env.uploadsDir, { recursive: true });
}

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`نوع الملف (${file.mimetype}) غير مسموح به.`, 400), false);
  }
};

// Vercel's filesystem is read-only, so images are only stored on disk elsewhere.
const imageStorage = env.isVercel
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: env.uploadsDir,
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${baseName}${ext}`);
      },
    });

export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: fileFilter(["image/jpeg", "image/png", "image/jpg"]),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Documents are parsed in memory and never written to disk.
export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

export const photoUrlFor = (file) => (file?.filename ? `/uploads/${file.filename}` : null);
