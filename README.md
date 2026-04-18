# Lumio — Online Learning Platform

A full-stack online learning platform where instructors create and publish courses, and students enroll, track progress, and leave reviews. Built with Node.js, Express, MongoDB, Pug, and JWT authentication.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [How to Use the Website](#how-to-use-the-website)
- [API Reference](#api-reference)
- [Security](#security)

---

## Features

### Authentication & Users

- JWT authentication with **access token (1 hour)** + **refresh token (30 days)**
- Role-based access control: **Student**, **Instructor**, **Admin**
- Email verification flow: forgot password → reset via emailed link (Gmail)
- Soft-delete account (sets `active: false`, data preserved)
- Profile photo upload via Multer

### Courses

- Instructors can create, edit, publish, and unpublish courses
- Course thumbnail image upload
- Categories: Web Development, Mobile Development, Data Science & ML, DevOps & Cloud, Cybersecurity, Game Development, AI & Machine Learning, Blockchain, Database, Programming Languages
- Levels: Beginner, Intermediate, Advanced, All Levels
- Full-text search on title, description, and tags
- Filter by category, level, and price range
- Sort, paginate, and limit fields on all list endpoints

### Lessons

- Video upload (MP4, WebM, MOV up to 500MB)
- Free preview flag — non-enrolled users can watch free lessons
- Custom HTML5 video player with keyboard shortcuts

### Enrollments & Payments

- Free courses: direct enrollment with one click
- Paid courses: Stripe Checkout integration (hosted payment page)
- Webhook-based enrollment creation after successful payment
- Booking record created for every paid enrollment (audit trail)

### Learning Experience

- Per-lesson progress tracking (mark complete — one-way)
- Overall course `progressPercent` auto-calculated on each lesson completion
- "Continue Learning" button goes to first incomplete lesson
- Course completion state shown when all lessons are done

### Social

- Comments on lessons (enrolled students only)
- 1–5 star ratings with written reviews (enrolled students only)
- Average rating auto-recalculated on create/update/delete

---

## Tech Stack

| Layer        | Technology                                                    |
| ------------ | ------------------------------------------------------------- |
| Runtime      | Node.js 20+ (ESM)                                             |
| Framework    | Express 4                                                     |
| Database     | MongoDB + Mongoose 8                                          |
| Templating   | Pug 3                                                         |
| Auth         | JWT (access + refresh), bcryptjs                              |
| Email        | Nodemailer + Gmail App Password                               |
| Payments     | Stripe Checkout                                               |
| File Uploads | Multer                                                        |
| Validation   | express-validator                                             |
| Security     | Helmet, CORS, express-rate-limit, HPP, express-mongo-sanitize |
| API Docs     | Swagger UI at `/api-docs`                                     |

---

## Project Structure

```
lumio/
├── server.js                   # Entry point — connects DB, starts server
├── src/
│   ├── app.js                  # Express app setup — middleware, routes
│   ├── controllers/            # Route handlers (business logic)
│   │   ├── authController.js   # signup, login, logout, forgot/reset password
│   │   ├── userController.js   # getMe, updateMe, deleteMe, admin CRUD
│   │   ├── courseController.js # CRUD, publish/unpublish, stats
│   │   ├── lessonController.js # CRUD, access control
│   │   ├── enrollmentController.js
│   │   ├── commentController.js
│   │   ├── ratingController.js
│   │   ├── progressController.js
│   │   ├── paymentController.js  # Stripe checkout + webhook
│   │   └── viewController.js   # Pug page renders
│   ├── middleware/
│   │   ├── authMiddleware.js   # protect, isLoggedIn, restrictTo
│   │   ├── uploadMiddleware.js # Multer — photo, thumbnail, video
│   │   ├── validateMiddleware.js
│   │   └── resource/           # Per-resource ownership middleware // this foler was deleted and the files inside it are in the middlware fodlder directly
│   │       ├── courseMiddleware.js
│   │       ├── lessonMiddleware.js
│   │       ├── commentMiddleware.js
│   │       └── ratingMiddleware.js
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # Express routers
│   ├── utils/
│   │   ├── handlerFactory.js   # Generic CRUD (Jonas-style)
│   │   ├── apiFeatures.js      # filter, search, sort, paginate
│   │   ├── catchAsync.js
│   │   ├── appError.js
│   │   ├── email.js            # Email class — Gmail via Nodemailer
│   │   └── generateTokens.js
│   ├── validators/
│   └── views/                  # Pug templates + email templates
├── postman/                    # Postman collection (all endpoints)
└── config/                     # Swagger config
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- A Gmail account with App Password enabled
- A Stripe account (for paid course checkout)

### Installation

```bash
# Clone the repository
git clone https://github.com/NardeenHany-2003/lumio.git
cd lumio

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
# Fill in your values (see Environment Variables below)

# Start development server
npm run dev
# or
node server.js
```

The server starts at `http://localhost:3000`.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Server
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/lumio

# JWT
JWT_ACCESS_SECRET=your_strong_access_secret_here
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your_strong_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=30d

# Email — Gmail App Password
# Setup: myaccount.google.com → Security → 2-Step Verification → App passwords
EMAIL_FROM=your.email@gmail.com
EMAIL_APP_PASS=xxxx xxxx xxxx xxxx

# Stripe (for paid course checkout)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Getting a Gmail App Password

1. Go to [myaccount.google.com](https://myaccount.google.com) → **Security**
2. Enable **2-Step Verification** (required)
3. Search **"App passwords"** → create one named `Lumio`
4. Copy the 16-character password into `EMAIL_APP_PASS`

### Getting Stripe Keys

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → **Developers → API Keys**
2. Copy **Secret key** into `STRIPE_SECRET_KEY`
3. For the webhook secret, run the Stripe CLI locally:
   ```bash
   stripe listen --forward-to localhost:4000/api/v1/payments/webhook-checkout
   ```
   Copy the `whsec_...` value into `STRIPE_WEBHOOK_SECRET`

---

## How to Use the Website

### As a Student

1. **Sign up** at `/signup` — choose the Student role
2. **Browse courses** at `/courses` — filter by category, level, or price; search by keyword
3. **Open a course** — read the description, requirements, and lesson list
4. **Enroll:**
   - Free course → click **Enroll for Free** → enrolled instantly
   - Paid course → click **Buy Now** → redirected to Stripe Checkout → pay → auto-enrolled on return
5. **Start learning** — click **Continue Learning** to go to your first lesson
6. **In the lesson player:**
   - Watch the video (custom player with keyboard shortcuts: Space, ←→ seek, ↑↓ volume, M mute, F fullscreen)
   - Click **Mark as Complete** when done (one-way — cannot undo)
   - Navigate with **Previous / Next** buttons
   - When the last lesson is finished, click **Finish Course 🎉**
7. **Track progress** from your **Dashboard** — see enrolled courses and completion percentage
8. **Leave a review** — once enrolled, scroll to the Reviews section on the course page
9. **Update your profile** at `/profile` — change name, email, bio, or photo; update password
10. **Deactivate account** — scroll to the Danger Zone on the profile page

### As an Instructor

1. **Sign up** at `/signup` — choose the Instructor role
2. **Create a course** at `/courses/new`:
   - Fill in title, description, category, level, price (0 = free)
   - Upload a thumbnail image
   - Add lessons with optional video files and a free-preview flag
   - Choose **Save as Draft** or **Publish Now**
3. **Manage your courses** from the **Dashboard** — see all your courses and their stats
4. **Edit a course** — click the edit icon to update course info, add/edit/remove lessons, and change the thumbnail
5. **Publish / Unpublish** — control course visibility from the edit page
6. **View enrolled students** via the API (`GET /api/v1/courses/:id/enrollments`)

---

## API Reference

The Postman collection at `postman/Lumio_API.postman_collection.json` covers every endpoint with example request bodies and auto-saves IDs after create operations.

### Base URL

```
http://localhost:4000/api/v1
```

### Endpoint Summary

| Resource    | Method           | Endpoint                               | Auth               |
| ----------- | ---------------- | -------------------------------------- | ------------------ |
| Auth        | POST             | `/auth/signup`                         | Public             |
| Auth        | POST             | `/auth/login`                          | Public             |
| Auth        | POST             | `/auth/logout`                         | Student/Instructor |
| Auth        | POST             | `/auth/refresh-token`                  | Public             |
| Auth        | POST             | `/auth/forgot-password`                | Public             |
| Auth        | PATCH            | `/auth/reset-password/:token`          | Public             |
| Auth        | PATCH            | `/auth/update-password`                | Any                |
| Users       | GET              | `/users/me`                            | Any                |
| Users       | PATCH            | `/users/update-me`                     | Any                |
| Users       | DELETE           | `/users/delete-me`                     | Any                |
| Users       | GET              | `/users`                               | Admin              |
| Users       | GET/PATCH/DELETE | `/users/:id`                           | Admin              |
| Courses     | GET              | `/courses`                             | Public             |
| Courses     | GET              | `/courses/top-5`                       | Public             |
| Courses     | GET              | `/courses/stats`                       | Instructor+        |
| Courses     | GET              | `/courses/my`                          | Instructor         |
| Courses     | GET              | `/courses/:id`                         | Public             |
| Courses     | POST             | `/courses`                             | Instructor         |
| Courses     | PATCH            | `/courses/:id`                         | Instructor (owner) |
| Courses     | DELETE           | `/courses/:id`                         | Instructor (owner) |
| Courses     | PATCH            | `/courses/:id/publish`                 | Instructor (owner) |
| Courses     | PATCH            | `/courses/:id/unpublish`               | Instructor (owner) |
| Lessons     | GET              | `/courses/:courseId/lessons`           | Public/Enrolled    |
| Lessons     | GET              | `/lessons/:id`                         | Public/Enrolled    |
| Lessons     | POST             | `/lessons`                             | Instructor         |
| Lessons     | PATCH            | `/lessons/:id`                         | Instructor (owner) |
| Lessons     | DELETE           | `/lessons/:id`                         | Instructor (owner) |
| Enrollments | POST             | `/courses/:courseId/enrollments`       | Student            |
| Enrollments | DELETE           | `/courses/:courseId/enrollments`       | Student            |
| Enrollments | GET              | `/courses/:courseId/enrollments`       | Instructor         |
| Enrollments | GET              | `/courses/:courseId/enrollments/check` | Any                |
| Enrollments | GET              | `/enrollments/my`                      | Student            |
| Payments    | GET              | `/payments/checkout-session/:courseId` | Student            |
| Payments    | POST             | `/payments/webhook-checkout`           | Stripe (internal)  |
| Comments    | GET              | `/comments/:lessonId/comments`         | Public             |
| Comments    | POST             | `/comments`                            | Enrolled student   |
| Comments    | PATCH            | `/comments/:id`                        | Author             |
| Comments    | DELETE           | `/comments/:id`                        | Author/Admin       |
| Ratings     | GET              | `/courses/:courseId/ratings`           | Public             |
| Ratings     | POST             | `/courses/:courseId/ratings`           | Enrolled student   |
| Ratings     | PATCH            | `/courses/:courseId/ratings/:id`       | Author             |
| Ratings     | DELETE           | `/courses/:courseId/ratings/:id`       | Author/Admin       |
| Progress    | GET              | `/progress/courses/:courseId`          | Enrolled student   |
| Progress    | GET              | `/progress/lessons/:lessonId`          | Enrolled student   |
| Progress    | PATCH            | `/progress/lessons/:lessonId`          | Enrolled student   |

---

## Security

- **Helmet** — sets secure HTTP headers
- **CORS** — allows all origins in development; restricted in production
- **Rate limiting** — 100 requests/15min globally; stricter 20/15min on auth routes
- **HPP** — prevents HTTP parameter pollution
- **NoSQL injection sanitization** — via express-mongo-sanitize
- **JWT** — access token (1h, HttpOnly cookie, SameSite: lax), refresh token (30d)
- **Password hashing** — bcryptjs with cost factor 12
- **Input validation** — express-validator on all write endpoints
- **Role-based access** — Student / Instructor / Admin enforced per route
