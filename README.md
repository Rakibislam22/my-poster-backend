# ⚙️ Amar Poster (আমার পোস্টার) - Backend API

> **High-Performance Image Compositing Engine & RESTful API for Bengali Poster Generation**  
> Built with Node.js, Express 5, TypeScript, `@napi-rs/canvas`, MongoDB Atlas, and Google Gemini AI.

---

## 🌟 Overview

The **Amar Poster Backend** powers the high-precision image compositing and moderation pipeline for political, social, and cultural posters in Bangladesh. It provides a multi-layer canvas rendering sandwich engine ($1200 \times 800$), multi-photo slot coordinate alignment, Google Gemini AI slogan drafting, Cloudinary asset delivery, and an automated Super Admin content moderation queue.

---

## ✨ Key Features

### 1. 🖼️ Multi-Layer "Sandwich" Rendering Engine (`@napi-rs/canvas`)

- **Native Canvas 2D Performance**: Utilizes Rust-backed `@napi-rs/canvas` for ultra-fast, pixel-perfect server-side image processing.
- **Layer 1 - Background Canvas**: Calibrated $1200 \times 800$ high-resolution occasion artwork (Elections, Victory Day, Eid, Condolences).
- **Layer 2 - Leader Portraits**: Circular clipping with custom border widths, glowing strokes, and multi-leader coordinate mapping (1 to 3 leaders).
- **Layer 3 - Candidate Portrait**: Bottom-aligned candidate photo masking with gradient fading and feathered boundaries.
- **Layer 4 - Foreground Frame & Badges**: Ribbons, Islamic crescents, National Flags, and decorative emblems overlaid above portraits.
- **Layer 5 - Bengali Typography**: High-legibility Bengali text rendering for candidate name, designation, party affiliation, location, and slogans.

### 2. 🤖 Google Gemini AI Integration

- **Context-Aware Slogan Generator**: Uses `@google/generative-ai` (Gemini Pro) to generate inspirational, election-compliant Bengali political slogans and festival greetings.
- **Custom Occasion Calibration**: Generates contextual slogans tailored specifically to Campaign, Victory Day, Condolence, or Eid.

### 3. ☁️ Dual Storage Architecture (Cloudinary + Local Fallback)

- **Cloudinary Storage**: High-speed CDN delivery and cloud persistence for generated posters and uploaded portraits.
- **Automatic Local Fallback**: Seamless fallback to local disk storage (`/uploads`) if Cloudinary credentials are not configured or offline.

### 4. 🛡️ Content Moderation & Admin Control Engine

- **Automated Queueing**: Posters are submitted to a moderation pipeline with status tracking (`pending`, `approved`, `rejected`, `flagged`).
- **Interactive Admin Operations**:
  - Live moderation status updates (`approve`, `reject` with reason notes, `flag`).
  - Aggregated real-time metrics (Pending queue, Approved count, Rejection logs, Template health).
  - Hard deletion of non-compliant posters.
  - One-click template re-seeding script execution.

### 5. 🔐 Authentication & Role-Based Access Control (RBAC)

- **JWT Stateless Sessions**: Secure token issuance with configurable expiration.
- **Bcrypt Password Hashing**: Robust credential protection.
- **Role Hierarchy**: Strict separation between standard users (`user`) and system administrators (`admin`).
- **One-Click Demo & Admin Logins**: Built-in test accounts for instant developer and reviewer evaluation.

### 6. 🔒 Production Security & Rate Limiting

- **Helmet**: Hardened HTTP security headers and Cross-Origin Resource Policy.
- **CORS**: Domain whitelisting for Next.js frontend clients.
- **Express Rate Limiters**: Dedicated rate limiting for authentication, photo uploads, and poster generation endpoints to prevent abuse.
- **Zod Validation**: Strict schema validation for incoming request payloads.

---

## 🛠️ Tech Stack

| Technology                      | Purpose                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| **Node.js 20+**                 | Server runtime environment                                  |
| **Express 5.2.1**               | Fast and minimalist REST API framework                      |
| **TypeScript 5+**               | Full static typing across models, controllers, and services |
| **tsx 4.23+**                   | Zero-config TypeScript watcher for fast local development   |
| **MongoDB & Mongoose 9**        | NoSQL document database and ODM schema definitions          |
| **@napi-rs/canvas 0.1.68**      | Rust-backed Canvas graphics compositing library             |
| **@google/generative-ai 0.24**  | Google Gemini AI SDK for Bengali slogan generation          |
| **Cloudinary SDK 2.6**          | Cloud image storage and asset transformation                |
| **Multer 2.4**                  | Multi-part form data handler for image uploads              |
| **JSON Web Token & BcryptJS**   | Stateless auth token signing and password encryption        |
| **Zod 4.6**                     | Runtime schema declaration and data validation              |
| **Helmet & Express Rate Limit** | Application security and DDoS prevention                    |

---

## 📁 Project Structure

```text
my-poster-backend/
├── scripts/
│   ├── seedTemplates.ts         # Calibrated template seeding script
│   └── testPosterRender.ts      # Standalone canvas rendering tester
├── src/
│   ├── config/
│   │   ├── db.ts                # MongoDB connection handler
│   │   └── env.ts               # Type-safe environment variable parser (Zod)
│   ├── controllers/
│   │   ├── adminController.ts   # Moderation queue & template management logic
│   │   ├── authController.ts    # Login, registration, demo & admin auth
│   │   ├── posterController.ts  # Poster generation & user poster actions
│   │   └── templateController.ts# Template listing & details
│   ├── middlewares/
│   │   ├── authMiddleware.ts    # JWT token verification & role enforcement
│   │   ├── errorHandler.ts      # Centralized HTTP error handler
│   │   ├── notFoundHandler.ts   # 404 route fallback
│   │   ├── rateLimiter.ts       # Endpoint-specific rate limiting policies
│   │   └── uploadMiddleware.ts  # Multer configuration for portrait uploads
│   ├── models/
│   │   ├── Poster.ts            # Poster schema with moderationStatus & metadata
│   │   ├── Template.ts          # Template schema with slot coordinates
│   │   └── User.ts              # User schema with roles and bcrypt methods
│   ├── routes/
│   │   ├── adminRoutes.ts       # /api/admin endpoints
│   │   ├── authRoutes.ts        # /api/auth endpoints
│   │   ├── healthRoutes.ts      # /api/health endpoint
│   │   ├── posterRoutes.ts      # /api/posters endpoints
│   │   ├── templateRoutes.ts    # /api/templates endpoints
│   │   └── uploadRoutes.ts      # /api/upload endpoints
│   ├── services/
│   │   ├── aiService.ts         # Gemini AI slogan generation service
│   │   ├── posterCanvasService.ts# @napi-rs/canvas 1200x800 compositing engine
│   │   └── storageService.ts    # Cloudinary & local storage abstraction
│   ├── utils/
│   │   └── seedDatabase.ts      # Automated startup database seeder
│   ├── app.ts                   # Express app configuration & middleware pipeline
│   └── server.ts                # Server entry point & graceful shutdown hooks
├── .env                         # Server environment configuration
├── package.json                 # Dependencies and npm scripts
└── tsconfig.json                # TypeScript compiler configuration
```

---

## ⚙️ Prerequisites & Installation

### 1. Requirements

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **MongoDB**: MongoDB Atlas URI or local MongoDB instance (`v6.0+`)
- **Google Gemini API Key**: For slogan drafting (get from [Google AI Studio](https://aistudio.google.com/))
- **Cloudinary Account**: (Optional) For cloud asset delivery

### 2. Environment Configuration

Create a `.env` file in `my-poster-backend/`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database Configuration
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/posterDB?retryWrites=true&w=majority

# Authentication (JWT)
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d

# Cloudinary Storage (Optional, falls back to local /uploads if empty)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio
```

### 3. Installation

Navigate into the backend directory and install dependencies:

```bash
cd my-poster-backend
npm install
```

### 4. Database Seeding

Seed the database with pre-calibrated templates (Election Campaign, Victory Day, Condolences, Eid Mubarak):

```bash
npm run seed
```

### 5. Running the Server

Start the development server with live TypeScript reloading:

```bash
npm run dev
```

The API will be available at: **[http://localhost:5000](http://localhost:5000)**  
Health check endpoint: **[http://localhost:5000/api/health](http://localhost:5000/api/health)**

---

## 📡 API Reference

### 🏥 Health Check

| Method | Endpoint      | Description                      | Auth |
| ------ | ------------- | -------------------------------- | ---- |
| `GET`  | `/api/health` | Service health status and uptime | None |

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint                | Description                 | Auth       |
| ------ | ----------------------- | --------------------------- | ---------- |
| `POST` | `/api/auth/register`    | Register a new user account | None       |
| `POST` | `/api/auth/login`       | Authenticate existing user  | None       |
| `POST` | `/api/auth/demo-login`  | 1-click test user session   | None       |
| `POST` | `/api/auth/admin-login` | 1-click Super Admin session | None       |
| `GET`  | `/api/auth/me`          | Fetch authenticated profile | Bearer JWT |

### 🖼️ Templates (`/api/templates`)

| Method | Endpoint              | Description                                     | Auth        |
| ------ | --------------------- | ----------------------------------------------- | ----------- |
| `GET`  | `/api/templates`      | List all active templates with slot layouts     | None        |
| `GET`  | `/api/templates/:id`  | Get details and layout coordinates for template | None        |
| `POST` | `/api/templates/seed` | Re-seed calibrated templates                    | Super Admin |

### 🎨 Posters (`/api/posters`)

| Method   | Endpoint                    | Description                                        | Auth            |
| -------- | --------------------------- | -------------------------------------------------- | --------------- |
| `POST`   | `/api/posters/generate`     | Upload portraits & render $1200 \times 800$ poster | Optional/Bearer |
| `GET`    | `/api/posters/my-posters`   | List posters generated by current user             | Bearer JWT      |
| `GET`    | `/api/posters/:id`          | Fetch specific poster metadata                     | None            |
| `GET`    | `/api/posters/:id/download` | Trigger direct attachment file download            | None            |
| `DELETE` | `/api/posters/:id`          | Delete user's generated poster                     | Bearer JWT      |

### 🤖 AI Assistant (`/api/posters`)

| Method | Endpoint                 | Description                                   | Auth |
| ------ | ------------------------ | --------------------------------------------- | ---- |
| `POST` | `/api/posters/ai-slogan` | Generate authentic Bengali slogans via Gemini | None |

### 🛡️ Admin Moderation Queue (`/api/admin`)

| Method   | Endpoint                           | Description                                     | Auth        |
| -------- | ---------------------------------- | ----------------------------------------------- | ----------- |
| `GET`    | `/api/admin/moderation`            | Paginated moderation list with status filters   | Super Admin |
| `GET`    | `/api/admin/moderation/stats`      | Aggregated queue counts and health overview     | Super Admin |
| `PATCH`  | `/api/admin/moderation/:id/status` | Update status (`approved`/`rejected`/`flagged`) | Super Admin |
| `DELETE` | `/api/admin/moderation/:id`        | Hard delete poster record & files               | Super Admin |
| `POST`   | `/api/admin/templates/reseed`      | Re-seed and calibrate templates                 | Super Admin |

---

## 📜 Available Scripts

| Command               | Description                                                    |
| --------------------- | -------------------------------------------------------------- |
| `npm run dev`         | Runs backend in development mode with `tsx watch`              |
| `npm run build`       | Compiles TypeScript source to production JavaScript in `dist/` |
| `npm run start`       | Runs the compiled production server from `dist/server.js`      |
| `npm run seed`        | Seeds calibrated templates into the MongoDB database           |
| `npm run test:render` | Executes standalone test poster canvas rendering               |

---

## 🚀 Production Deployment

1. Set `NODE_ENV=production` in environment variables.
2. Build the project:
   ```bash
   npm run build
   ```
3. Run the compiled server:
   ```bash
   npm run start
   ```
4. Compatible with **Render**, **Railway**, **AWS EC2**, or any Dockerized container supporting native Node.js C++ bindings for `@napi-rs/canvas`.

---

## 📄 License

This project is licensed under the ISC License.
