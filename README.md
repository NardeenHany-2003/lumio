# 💡 Lumio — Online Learning Platform

> A full-stack online learning platform where instructors create courses and students enroll in them. Built with Node.js, Express, MongoDB, Pug, and JWT authentication.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Setup](#local-setup)
  - [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Running Tests](#running-tests)
- [API Documentation](#api-documentation)

---

## ✨ Features

### Core
- 🔐 JWT authentication with **access token (1h)** + **refresh token (30d)**
- 👥 Role-based access control: **Student**, **Instructor**, **Admin**
- 📚 Instructors can create, publish, and manage courses
- 🎓 Students can enroll in and unenroll from published courses
- 📝 Students can comment on lessons they are enrolled in
- ⭐ Students can rate and review courses they are enrolled in

### Extra Features
- 📊 **Lesson progress tracking** — per-lesson completion, auto-calculates enrollment `progressPercent`
- 🔍 **Search & filter courses** — by category, level, price, rating; full-text search on title/description/tags
- 📄 **Pagination** — page-based on all list endpoints (`?page=1&limit=10`)
- 🗂️ **Course categories** — Web Development, Mobile Development, Data Science & ML, DevOps & Cloud, Cybersecurity, AI & Machine Learning, Game Development, Blockchain, Database, Programming Languages

### Bonus
- 📖 **Swagger / OpenAPI docs** at `/api-docs`
- 🧪 **Jest integration tests** for auth and course flows
- 🐳 **Docker** — multi-stage `Dockerfile` + `docker-compose.yml` with MongoDB and Mongo Express
- 🛡️ **Security middleware** — Helmet, CORS, rate limiting (global + stricter auth limiter), HPP, NoSQL injection sanitization, compression
- 📈 **MongoDB aggregation** — course stats by category (`GET /api/v1/courses/stats`)

---

## 🛠 Tech Stack

| Layer       | Technology                                         |
|-------------|----------------------------------------------------|
| Runtime     | Node.js 20 (ESM / `"type": "module"`)             |
| Framework   | Express 4                                          |
| Database    | MongoDB 7 + Mongoose 8                             |
| Auth        | JWT (access + refresh), bcryptjs, cookie-parser    |
| Validation  | express-validator                                  |
| View Engine | Pug 3                                              |
| Security    | Helmet, express-mongo-sanitize, hpp, express-rate-limit |
| Docs        | Swagger UI (swagger-jsdoc + swagger-ui-express)    |
| Testing     | Jest + Supertest                                   |
| DevOps      | Docker, docker-compose                             |

---

## 🗂 Project Structure

```
lumio/
├── server.js                    # Entry point
├── config/
│   └── swagger.js               # OpenAPI spec
├── src/
│   ├── app.js                   # Express app setup
│   ├── controllers/             # Route handlers
│   │   ├── authController.js
│   │   ├── courseController.js
│   │   ├── lessonController.js
│   │   ├── enrollmentController.js
│   │   ├── commentController.js
│   │   ├── ratingController.js
│   │   └── progressController.js
│   ├── models/                  # Mongoose models
│   │   ├── userModel.js
│   │   ├── courseModel.js
│   │   ├── lessonModel.js
│   │   ├── enrollmentModel.js
│   │   ├── commentModel.js
│   │   ├── ratingModel.js
│   │   └── progressModel.js
│   ├── routes/                  # Express routers
│   │   ├── authRoutes.js
│   │   ├── courseRoutes.js
│   │   ├── lessonRoutes.js
│   │   ├── enrollmentRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── ratingRoutes.js
│   │   ├── progressRoutes.js
│   │   └── viewRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js    # protect, restrictTo, isLoggedIn
│   │   ├── errorMiddleware.js   # Global error handler
│   │   └── validateMiddleware.js
│   ├── validators/
│   │   ├── authValidators.js
│   │   ├── courseValidators.js
│   │   └── resourceValidators.js
│   ├── utils/
│   │   ├── appError.js          # Custom error class
│   │   ├── catchAsync.js        # Async wrapper
│   │   ├── apiFeatures.js       # Filter/sort/search/paginate
│   │   └── generateTokens.js   # JWT helpers
│   ├── views/                   # Pug templates
│   │   ├── base.pug
│   │   ├── home.pug
│   │   ├── courses.pug
│   │   ├── courseDetail.pug
│   │   ├── login.pug
│   │   ├── signup.pug
│   │   ├── dashboard.pug
│   │   ├── error.pug
│   │   └── partials/
│   │       ├── nav.pug
│   │       ├── footer.pug
│   │       └── courseCard.pug
│   └── public/
│       ├── css/main.css
│       └── js/
│           ├── main.js
│           ├── courses.js
│           ├── courseDetail.js
│           └── dashboard.js
├── tests/
│   ├── helpers/dbHelper.js
│   ├── auth.test.js
│   └── courses.test.js
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+
- **MongoDB** v6+ (local) or Docker

---

### Local Setup

**1. Clone the repository**
```bash
git clone https://github.com/your-username/lumio.git
cd lumio
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**
```bash
cp .env.example .env
```
Then open `.env` and fill in your values (see [Environment Variables](#environment-variables) below).

**4. Start MongoDB**

Make sure MongoDB is running locally on port `27017`, or update `MONGODB_URI` in `.env`.

**5. Run in development mode**
```bash
npm run dev
```

The server starts at **http://localhost:3000**
API docs are at **http://localhost:3000/api-docs**

---

### Docker Setup

> The easiest way to run Lumio with zero local dependencies.

**1. Set required secrets in your shell** (or create a `.env` file):
```bash
export JWT_ACCESS_SECRET=your_super_secret_access_key_here
export JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
```

**2. Start everything**
```bash
docker-compose up --build
```

| Service       | URL                          |
|---------------|------------------------------|
| Lumio App     | http://localhost:3000        |
| API Docs      | http://localhost:3000/api-docs |
| Mongo Express | http://localhost:8081        |

**3. Stop**
```bash
docker-compose down
```

**Tear down including volumes:**
```bash
docker-compose down -v
```

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable                 | Description                              | Default          |
|--------------------------|------------------------------------------|------------------|
| `NODE_ENV`               | `development` / `production` / `test`    | `development`    |
| `PORT`                   | Server port                              | `3000`           |
| `MONGODB_URI`            | MongoDB connection string                | —                |
| `JWT_ACCESS_SECRET`      | Secret for signing access tokens         | —                |
| `JWT_ACCESS_EXPIRES_IN`  | Access token lifetime                    | `1h`             |
| `JWT_REFRESH_SECRET`     | Secret for signing refresh tokens        | —                |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime                   | `30d`            |
| `JWT_COOKIE_EXPIRES_IN`  | Cookie expiry in days                    | `30`             |
| `RATE_LIMIT_WINDOW_MS`   | Rate limit window in ms                  | `900000` (15min) |
| `RATE_LIMIT_MAX`         | Max requests per window                  | `100`            |

---

## 📡 API Overview

All API endpoints are prefixed with `/api/v1`.

### Authentication

| Method | Endpoint                        | Access  | Description                  |
|--------|---------------------------------|---------|------------------------------|
| POST   | `/auth/signup`                  | Public  | Register a new user           |
| POST   | `/auth/login`                   | Public  | Log in, receive tokens        |
| POST   | `/auth/logout`                  | Auth    | Revoke refresh token          |
| POST   | `/auth/refresh-token`           | Public  | Exchange refresh for new pair |
| POST   | `/auth/forgot-password`         | Public  | Generate password reset token |
| PATCH  | `/auth/reset-password/:token`   | Public  | Reset password with token     |
| GET    | `/auth/me`                      | Auth    | Get current user              |
| PATCH  | `/auth/update-me`               | Auth    | Update name/email/bio         |
| PATCH  | `/auth/update-password`         | Auth    | Change password               |
| DELETE | `/auth/delete-me`               | Auth    | Soft-delete account           |

### Courses

| Method | Endpoint                        | Access        | Description                   |
|--------|---------------------------------|---------------|-------------------------------|
| GET    | `/courses`                      | Public        | List published courses (filter/search/paginate) |
| GET    | `/courses/top-5`                | Public        | Top 5 courses by rating       |
| GET    | `/courses/stats`                | Instructor+   | Aggregated stats by category  |
| GET    | `/courses/my`                   | Instructor    | Instructor's own courses      |
| GET    | `/courses/:id`                  | Public        | Get single course (by ID or slug) |
| POST   | `/courses`                      | Instructor    | Create a course               |
| PATCH  | `/courses/:id`                  | Instructor    | Update a course               |
| DELETE | `/courses/:id`                  | Instructor    | Delete a course               |
| PATCH  | `/courses/:id/publish`          | Instructor    | Publish a course              |
| PATCH  | `/courses/:id/unpublish`        | Instructor    | Unpublish a course            |

### Lessons

| Method | Endpoint                              | Access     | Description              |
|--------|---------------------------------------|------------|--------------------------|
| GET    | `/courses/:courseId/lessons`          | Public     | List lessons for a course |
| GET    | `/lessons/:id`                        | Public     | Get a single lesson       |
| POST   | `/lessons`                            | Instructor | Create a lesson           |
| PATCH  | `/lessons/:id`                        | Instructor | Update a lesson           |
| DELETE | `/lessons/:id`                        | Instructor | Delete a lesson           |

### Enrollments

| Method | Endpoint                                    | Access     | Description                   |
|--------|---------------------------------------------|------------|-------------------------------|
| GET    | `/enrollments/my`                           | Student    | My enrolled courses           |
| GET    | `/courses/:courseId/enrollments`            | Instructor | Students enrolled in course   |
| GET    | `/courses/:courseId/enrollments/check`      | Auth       | Check enrollment status       |
| POST   | `/courses/:courseId/enrollments`            | Student    | Enroll in a course            |
| DELETE | `/courses/:courseId/enrollments`            | Student    | Unenroll from a course        |

### Comments

| Method | Endpoint                        | Access  | Description             |
|--------|---------------------------------|---------|-------------------------|
| GET    | `/comments/:lessonId/comments`  | Public  | Get comments for lesson |
| POST   | `/comments`                     | Auth    | Post a comment          |
| PATCH  | `/comments/:id`                 | Auth    | Edit own comment        |
| DELETE | `/comments/:id`                 | Auth    | Delete own comment      |

### Ratings

| Method | Endpoint                             | Access  | Description              |
|--------|--------------------------------------|---------|--------------------------|
| GET    | `/courses/:courseId/ratings`         | Public  | Get course ratings        |
| POST   | `/courses/:courseId/ratings`         | Student | Rate a course            |
| PATCH  | `/ratings/:id`                       | Student | Update own rating        |
| DELETE | `/ratings/:id`                       | Auth    | Delete a rating          |

### Progress

| Method | Endpoint                             | Access  | Description                    |
|--------|--------------------------------------|---------|--------------------------------|
| GET    | `/progress/courses/:courseId`        | Student | Get course progress summary    |
| GET    | `/progress/lessons/:lessonId`        | Student | Get single lesson progress     |
| PATCH  | `/progress/lessons/:lessonId`        | Student | Mark lesson complete/incomplete |

---

### Query Parameters (Courses)

| Param              | Example                          | Description                    |
|--------------------|----------------------------------|--------------------------------|
| `search`           | `?search=node`                   | Full-text search               |
| `category`         | `?category=Web Development`      | Filter by category             |
| `level`            | `?level=Beginner`                | Filter by difficulty           |
| `price[lte]`       | `?price[lte]=50`                 | Max price                      |
| `price`            | `?price=0`                       | Free courses only              |
| `ratingsAverage[gte]` | `?ratingsAverage[gte]=4`      | Min rating                     |
| `sort`             | `?sort=-ratingsAverage`          | Sort field(s)                  |
| `page`             | `?page=2`                        | Page number (default: 1)       |
| `limit`            | `?limit=12`                      | Results per page (default: 10) |
| `fields`           | `?fields=title,price`            | Select specific fields         |

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

> Tests use a separate `lumio_test` database, cleaned between each test suite.

Test coverage:
- **`auth.test.js`** — signup, login, protected routes, logout, token validation
- **`courses.test.js`** — create, permissions, publish flow, enrollment rules

---

## 📖 API Documentation

Interactive Swagger UI is available at:

```
http://localhost:3000/api-docs
```

All endpoints are documented with request/response schemas, required fields, and authentication requirements.

---

## 🏗️ Architecture Notes

- **`catchAsync`** — eliminates try/catch in every controller
- **`AppError`** — custom error class distinguishing operational vs programming errors
- **`APIFeatures`** — reusable query builder: filter → search → sort → limitFields → paginate
- **Global error handler** — handles Mongoose cast errors, duplicate key errors, JWT errors differently in dev vs prod
- **Factory-style middleware** — `protect`, `restrictTo(...roles)`, `isLoggedIn`
- **Model hooks** — `post('save')` on Rating/Lesson/Enrollment auto-update denormalized stats on Course
