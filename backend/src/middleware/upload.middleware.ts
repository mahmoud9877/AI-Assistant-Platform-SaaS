import fs from "fs";
import path from "path";
import multer from "multer";
import { AppError } from "../core/app-error.js";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export class UploadMiddleware {
  readonly image: multer.Multer;
  // Documents are parsed in memory and never written to disk.
  readonly document: multer.Multer;

  constructor(uploadsDir: string, inMemoryOnly: boolean) {
    // Vercel's filesystem is read-only, so images are only stored on disk elsewhere.
    if (!inMemoryOnly) fs.mkdirSync(uploadsDir, { recursive: true });

    this.image = multer({
      storage: inMemoryOnly ? multer.memoryStorage() : UploadMiddleware.diskStorage(uploadsDir),
      fileFilter: UploadMiddleware.allow(IMAGE_TYPES),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    });

    this.document = multer({
      storage: multer.memoryStorage(),
      fileFilter: UploadMiddleware.allow(DOCUMENT_TYPES),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    });
  }

  static photoUrlFor(file?: Express.Multer.File): string | null {
    return file?.filename ? `/uploads/${file.filename}` : null;
  }

  private static diskStorage(uploadsDir: string): multer.StorageEngine {
    return multer.diskStorage({
      destination: uploadsDir,
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${baseName}${ext}`);
      },
    });
  }

  private static allow(types: string[]): multer.Options["fileFilter"] {
    return (_req, file, cb) => {
      if (types.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new AppError(`نوع الملف (${file.mimetype}) غير مسموح به.`, 400));
      }
    };
  }
}
