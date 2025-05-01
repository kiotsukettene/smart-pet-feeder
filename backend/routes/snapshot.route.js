import express from "express";
import {
  getAllSnapshots,
  createSnapshot,
  updateSnapshot,
  deleteSnapshot,
} from "../controllers/snapshot.controller.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Store files in the 'uploads/' directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // e.g., 1634567890123-123456789.jpg
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only JPEG/JPG/PNG images are allowed!"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Routes
router.get("/", getAllSnapshots);
router.post("/", upload.single("image"), createSnapshot); // Apply multer middleware for file upload
router.put("/:id", updateSnapshot);
router.delete("/:id", deleteSnapshot);

export default router;
