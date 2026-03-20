// middleware/upload.ts
import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB, opcional
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(csv)$/i)) {
      return cb(new Error("Solo se permiten archivos CSV"));
    }
    cb(null, true);
  },
});
