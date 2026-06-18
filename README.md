# 👁️ PublicEye: Public Grievance & Civic Issue Tracker System

**PublicEye** is a modern, full-stack civic tech web application designed to bridge the gap between citizens and local government authorities. It allows citizens to report local issues (such as potholes, water leaks, broken streetlights, or waste pileups) on an interactive map, track resolution progress, upvote issues, and receive updates. Local departments can manage their incoming tickets, while senior authorities monitor SLA (Service Level Agreement) compliance and handle escalations.

---

## 🚀 Key Features

### 👤 Citizen Portal
* **Interactive Issue Filing:** Pin issues directly onto a map (powered by Leaflet) with precise GPS coordinates.
* **Grievance Details:** Upload images, assign categories/departments, and write detailed descriptions.
* **Community Engagement:** Upvote other reported issues to highlight high-priority community needs.
* **Real-time Tracking:** Monitor status transitions (e.g., `Pending` ➡️ `In Progress` ➡️ `Resolved`).
* **Comments & Feedback:** Communicate directly with assigned departments on specific issue pages.

### 🏢 Department Panel
* **Department-Specific Queues:** Filter and display issues assigned to the specific department (e.g., Roads, Water).
* **Work Progress Management:** Transition issues from `Pending` to `In Progress` and upload resolution details upon completion.
* **Collaboration:** View comments and coordinate with senior authorities.

### 👑 Senior Authority Dashboard
* **SLA & Escalation Monitoring:** View a specialized overview of issues that violated standard response times (SLAs).
* **Performance Analytics:** Visual charts (via Recharts) analyzing department performance, resolution rates, and outstanding backlogs.
* **Manual/Auto Escalations:** Oversee issues elevated from department levels due to delays or customer dissatisfaction.

### 🛡️ Admin Portal
* **User Management:** Create, update, or deactivate accounts and assign roles.
* **Rule Engine Configuration:** Manage escalation rules, categories, and SLA thresholds.
* **Global Statistics:** Monitor system-wide civic health indicators.

---

## 🛠️ Technology Stack

### Frontend
* **Core:** [React 19](https://react.dev/) & [Vite 7](https://vite.dev/) (Fast and lightweight frontend build tool)
* **Routing:** [React Router DOM v7](https://reactrouter.com/)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (using `@tailwindcss/vite` configuration)
* **HTTP Client:** [Axios](https://axios-http.com/) for API integrations
* **Mapping:** [Leaflet](https://leafletjs.com/) & [React Leaflet v5](https://react-leaflet.js.org/) for geographic coordination
* **Charts/Analytics:** [Recharts](https://recharts.org/) for responsive charts
* **Notifications:** [React Hot Toast](https://react-hot.toast.com/) for fluid micro-animations

### Backend
* **Language:** [Python 3.11+](https://www.python.org/)
* **Web Framework:** [FastAPI](https://fastapi.tiangolo.com/) for robust, self-documenting REST APIs
* **ASGI Server:** [Uvicorn](https://www.uvicorn.org/)
* **ORM:** [SQLAlchemy v2](https://www.sqlalchemy.org/)
* **Migrations:** [Alembic](https://alembic.sqlalchemy.org/)
* **Database:** SQLite (local development `publiceye.db`) & PostgreSQL (production-ready via `psycopg2-binary`/Supabase)
* **Auth & Security:** JWT (JSON Web Tokens) with `python-jose` and password hashing with `bcrypt`
* **File Upload Handling:** Asynchronous multipart file uploads via `python-multipart` and `aiofiles`

---

## 📁 Repository Structure

```text
PublicEye/
├── frontend/               # React + Tailwind SPA
│   ├── src/
│   │   ├── pages/          # Admin, Dashboard, Dept, SeniorAuthority, Login, etc.
│   │   ├── components/     # Map component, Navbar, Cards, Charts, Modals
│   │   ├── context/        # Auth and global contexts
│   │   └── api/            # Axios instance and API call configurations
│   ├── package.json        # Frontend dependencies & scripts
│   └── vite.config.js      # Vite build settings
│
└── backend/                # Python FastAPI backend
    ├── app/
    │   ├── db/             # SQLAlchemy engine setup & database sessions
    │   ├── models/         # SQL database tables (User, Issue, Upvote, etc.)
    │   ├── routes/         # Endpoint handlers grouped by domain
    │   ├── schemas/        # Pydantic schemas for data serialization/validation
    │   └── main.py         # App entry point, CORS configuration, and seed data
    ├── static/             # Target directory for uploaded user issue images
    ├── requirements.txt    # Python requirements list
    └── alembic.ini         # Database migrations controller
```

---

## 🔧 Getting Started

Follow these steps to run the complete stack locally.

### 1. Backend Setup

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # On Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\activate

   # On Linux/macOS
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment variables template and customize it:
   ```bash
   cp .env.example .env
   ```
   *(By default, if `DATABASE_URL` points to a `sqlite:///./publiceye.db` engine, the SQLite database will auto-initialize).*
5. Run database migrations (optional, as the app creates tables on startup):
   ```bash
   alembic upgrade head
   ```
6. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will now be running at `http://127.0.0.1:8000`. You can view the interactive Swagger docs at `http://127.0.0.1:8000/docs`.

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the node packages:
   ```bash
   npm install
   ```
3. Setup the API URL variable by creating a `.env` file:
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_URL=http://localhost:8000` is defined in `.env`.
4. Start the frontend dev server:
   ```bash
   npm run dev
   ```
   The client application will run at `http://localhost:5173`.

---

## 🔑 Default Test Accounts

For testing, the database is automatically seeded on the first launch of the backend with these preconfigured accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **System Administrator** | `admin@publiceye.com` | `admin123` |
| **Roads & Transport Department** | `roads@publiceye.com` | `dept123` |
| **Water & Sanitation Department** | `water@publiceye.com` | `dept123` |
| **Senior Authority / Director** | `senior@publiceye.com` | `senior123` |

*Note: Citizens can sign up directly through the frontend **Register** page.*

---

## ⚙️ Deployment & Dockerization

* **Frontend Hosting:** Configured for Vercel deployment with [frontend/vercel.json](file:///c:/Users/omkar/Desktop/PublicEye-Public-Grievance-Civic-Issue-Tracker-System/frontend/vercel.json).
* **Backend Hosting:** Can be deployed to Render via [backend/render.yaml](file:///c:/Users/omkar/Desktop/PublicEye-Public-Grievance-Civic-Issue-Tracker-System/backend/render.yaml).
* **Containerization:** A `Dockerfile` is provided in the `backend/` directory for deploying the FastAPI server in a Docker container.
