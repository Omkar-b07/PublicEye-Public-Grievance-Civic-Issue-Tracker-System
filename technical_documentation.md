# Public Eye - Technical Documentation

This document outlines the complete technical details, architecture, and workflow for the **Public Eye** civic grievance and issue tracker system.

## 1. Frontend Architecture & Tech Stack

The frontend is a modern Single Page Application (SPA) built with a focus on responsiveness, geographic data visualization, and smooth user experience.

- **Framework:** React 19
- **Build Tool / Bundler:** Vite (v7.3.1)
- **Styling:** Tailwind CSS (v4) with Autoprefixer
- **Routing:** React Router DOM (v7)
- **API Client:** Axios (Configured with request interceptors for JWT token injection)
- **Mapping:** Leaflet & React-Leaflet (for interactive coordinate plotting)
- **Data Visualization:** Recharts (for admin analytics dashboards)
- **UI Components:** 
  - Icons: Lucide React
  - Notifications: React Hot Toast

---

## 2. Backend Architecture & Tech Stack

The backend uses a modular, layered RESTful architecture. Code is strictly separated into `routes`, `models` (database representation), `schemas` (data validation/serialization), and `utils`.

- **Framework:** FastAPI (Python)
- **ASGI Server:** Uvicorn
- **Object Relational Mapper (ORM):** SQLAlchemy 2.0
- **Database Migrations:** Alembic
- **Data Validation:** Pydantic (v2) and Pydantic-Settings
- **Image Handling:** python-multipart, aiofiles (local storage under `/static/uploads`)

---

## 3. Database Structure & Schema

The application uses **PostgreSQL** (hosted on Supabase) with a local development fallback to **SQLite**. The schema consists of three core tables:

### Table: `users`
Stores all platform users with role-based segregation.
- `id` (String, Primary Key, UUID)
- `name` (String)
- `email` (String, Unique, Indexed)
- `phone` (String, Unique, Indexed, Nullable)
- `password_hash` (String)
- `role` (String) - Enum: `"citizen"`, `"admin"`, `"department"`, `"senior_authority"`
- `created_at` (DateTime)

### Table: `issues`
The core entity storing civic grievances.
- `id` (String, Primary Key, UUID)
- `title` (String), `description` (Text), `category` (String)
- `address` (String), `latitude` (Float), `longitude` (Float)
- `image_url` (String, Nullable)
- `status` (String) - Enum: `"PENDING"`, `"VERIFIED"`, `"IN_PROGRESS"`, `"RESOLVED"`, `"REJECTED"`
- `priority` (String) - Enum: `"HIGH"`, `"MEDIUM"`, `"LOW"`
- `is_verified` (Boolean), `is_rejected` (Boolean)
- `upvotes` (Integer, default 0)
- `feedback_rating` (Integer), `feedback_text` (Text)
- `created_at`, `resolved_at`, `escalated_at` (DateTime)
- `created_by` (Foreign Key -> `users.id`)
- `assigned_to` (Foreign Key -> `users.id`, Nullable)

### Table: `upvotes`
A junction/tracking table to prevent double-voting.
- `id` (String, Primary Key, UUID)
- `user_id` (Foreign Key -> `users.id`)
- `issue_id` (Foreign Key -> `issues.id` with CASCADE delete)
- `created_at` (DateTime)
- *Constraint:* Unique constraint on `(user_id, issue_id)`

---

## 4. API Endpoints

The system relies entirely on custom-built REST APIs. No third-party APIs (like Google Maps) are strictly required (OSM tiles are used for Leaflet).

- **`/auth/`**: Signup, Login (JWT), Fetch `me`, OTP sending/verification, Forgot Password.
- **`/issues/`**: 
  - `POST /`: Create issue (Accepts Multipart Form Data for images)
  - `GET /`: List issues (Citizens see only their own, filtered)
  - `GET /map`: Lightweight endpoint specifically for map markers
  - `POST /{id}/upvote`: Toggle an upvote
  - `POST /{id}/feedback`: Post-resolution feedback
- **`/admin/`**: Fetch all system issues, verify, reject, assign to departments, and check duplicates.
- **`/department/`**: Fetch assigned issues, mark as resolved, or escalate.

---

## 5. System Workflow

1. **Reporting:** A citizen registers/logs in and submits an issue by dropping a pin on the map and uploading a photo. Status is `PENDING`.
2. **Triaging:** An Administrator logs into the Admin Dashboard, reviews the issue, and marks it as `VERIFIED` (or `REJECTED` if spam/duplicate).
3. **Assignment:** The Admin assigns the verified issue to the relevant department (e.g., "Water & Sanitation Dept"). Status becomes `IN_PROGRESS`.
4. **Resolution:** The Department logs in, sees their specific queue, completes the physical work, and marks the issue as `RESOLVED` (capturing the `resolved_at` timestamp).
5. **Feedback & Engagement:** Other citizens can `Upvote` verified issues to increase visibility. Once resolved, the original creator can leave a 1-5 star feedback rating on the work done.

---

## 6. Authentication Tech Stack & Logic

- **Standard:** OAuth2 with Bearer Tokens (JWT).
- **Libraries:** `python-jose` for JWT signing/decoding, `bcrypt` (via `passlib`) for password hashing.
- **Logic:** 
  - Upon successful login, the backend issues an `access_token` valid for 7 days.
  - The frontend stores this token in `localStorage` and attaches it via an Axios Interceptor to all subsequent requests.
  - The backend uses dependency injection (`Depends(get_current_user)`, `Depends(get_current_admin)`) to protect routes and ensure Role-Based Access Control (RBAC).
  - OTP and Forgot Password flows use an in-memory dictionary cache with 5-minute expiration times (mocked securely to server console for dev environments).

---

## 7. Hosting and Deployment Info

- **Frontend:** Contains a `vercel.json` configured for SPA routing (`source: "/(.*)", destination: "/index.html"`), indicating it is structured for deployment on **Vercel** or Netlify.
- **Backend:** Contains a `render.yaml` configuration, indicating deployment as a Web Service on **Render**.
- **Database:** Hosted remotely on **Supabase** (PostgreSQL).

---

## 8. AI / ML Features

The application does not currently use heavy Machine Learning models (like Neural Networks or LLMs), but it does feature an advanced **Heuristic / Algorithmic System** for intelligent duplicate detection:

**Smart Duplicate Detection Algorithm (`/utils/duplicate_detection.py`)**
Combines two mathematical checks to flag duplicates to admins:
1. **Geospatial Distance:** Uses the mathematical **Haversine formula** to calculate the exact great-circle distance between two GPS coordinates, flagging issues within 500 meters of each other.
2. **Natural Language Processing (Light):** Uses Python's native `difflib.SequenceMatcher` (Gestalt Pattern Matching) to analyze the textual similarity between the titles and descriptions of nearby issues. If text overlap exceeds 45%, it is surfaced to the Admin as a highly probable duplicate.
