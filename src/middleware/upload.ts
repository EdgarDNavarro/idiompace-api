// middleware/upload.ts
import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(csv)$/i)) {
      return cb(new Error("Solo se permiten archivos CSV"));
    }
    cb(null, true);
  },
});

export const uploadPdf = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(pdf)$/i)) {
      return cb(new Error("Solo se permiten archivos PDF"));
    }
    cb(null, true);
  },
});

export const uploadImage = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/^image\/(jpeg|png|webp|gif)$/)) {
      return cb(new Error("Solo se permiten imágenes JPG, PNG, WEBP o GIF"));
    }
    cb(null, true);
  },
});
