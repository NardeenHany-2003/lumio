import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { webhookCheckout } from './controllers/paymentController.js';
import viewRoutes from './routes/viewRoutes.js';
import globalErrorHandler from './middleware/errorMiddleware.js';
import AppError from './utils/appError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// View Engine 
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img/users', express.static(path.join(__dirname, 'public/img/users')));
app.use(
  '/img/courses',
  express.static(path.join(__dirname, 'public/img/courses')),
);
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));

app.use(
  '/bs-icons',
  express.static(path.join(__dirname, '../node_modules/bootstrap-icons/font')),
);

// Security: HTTP headers 
// Disable CSP in development so CDN assets (icons, fonts) load freely.
// In production, CSP is enforced with strict directives.
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === 'production'
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
              styleSrc: [
                "'self'",
                "'unsafe-inline'",
                'fonts.googleapis.com',
                'cdn.jsdelivr.net',
              ],
              fontSrc: ["'self'", 'fonts.gstatic.com', 'cdn.jsdelivr.net'],
              imgSrc: ["'self'", 'data:', 'https:'],
            },
          }
        : false,
  }),
);

// CORS 
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'development'
        ? '*'
        : process.env.ALLOWED_ORIGINS,
    credentials: true,
  }),
);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again in 15 minutes.',
  },
});
app.use('/api', limiter);

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    status: 'error',
    message:
      'Too many authentication attempts, please try again in 15 minutes.',
  },
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/signup', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);

// Stripe Webhook (raw body MUST come before express.json)
app.post(
  '/api/v1/payments/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout,
);

// Body Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data Sanitization
// Against NoSQL injection
app.use(mongoSanitize());

// Against HTTP Parameter Pollution
app.use(
  hpp({
    whitelist: [
      'sort',
      'fields',
      'page',
      'limit',
      'category',
      'level',
      'price',
    ],
  }),
);

// Compression
app.use(compression());

// View Routes (Pug Frontend)
app.use('/', viewRoutes);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/lessons', lessonRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/ratings', ratingRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/payments', paymentRoutes);

// 404 Handler
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server.`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
