import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import AppError from '../utils/appError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage: save to src/public/img/users/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/img/users'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `user-${req.user.id}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

// Filter: images only 
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed.', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

export const uploadUserPhoto = upload.single('photo');

// Course thumbnail upload 
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/img/courses'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `course-${req.user.id}-${Date.now()}${ext}`);
  },
});

export const uploadCourseThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter, // reuse same image-only filter
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('thumbnail');

// Video upload (new)
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/videos'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `lesson-${req.user.id}-${Date.now()}${ext}`);
  },
});

const videoFilter = (req, file, cb) => {
  const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else
    cb(
      new AppError('Only video files are allowed (mp4, webm, ogg, mov).', 400),
      false,
    );
};

export const uploadLessonVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
}).single('video');
