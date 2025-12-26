# Technical Specification

## 1. Project Structure

This project follows a monorepo-style structure containing both backend and frontend services, along with documentation and configuration files.

### 1.1 Backend Structure (`/backend`)

The backend is built with Node.js and Express, following a layered architecture (Controller-Service-Model pattern).

```text
backend/
├── Dockerfile                 # Docker build instructions for production
├── .env.example               # Template for environment variables
├── package.json               # Dependencies and scripts
├── src/
│   ├── config/                # Database and environment configuration
│   ├── controllers/           # Request handlers (input validation, response formatting)
│   ├── middleware/            # Auth checks, Tenant Isolation, Error handling
│   ├── models/                # Database schema definitions or query builders
│   ├── routes/                # API route definitions linked to controllers
│   ├── services/              # Business logic layer
│   └── utils/                 # Helper functions (logger, response wrapper)
├── migrations/                # SQL migration files (001_initial_schema.sql)
├── seeds/                     # Seed data scripts
└── tests/                     # Unit and integration tests
```

**Key Folders:**

- **middleware/**: Critical for security. Contains `authMiddleware` (JWT verification) and `tenantMiddleware` (injects `tenant_id` into queries).
- **migrations/**: Raw SQL files to create the database schema. These run automatically on container startup.
- **controllers/**: Handles the HTTP request lifecycle. All 19 API endpoints map to functions here.

---

### 1.2 Frontend Structure (`/frontend`)

The frontend is a React application created using Create React App or Vite.

```text
frontend/
├── Dockerfile                 # Docker build instructions for frontend
├── package.json               # Dependencies
├── public/                    # Static assets (favicon, index.html)
└── src/
    ├── components/            # Reusable UI components
    │   ├── common/            # Navbar, Sidebar, etc.
    │   └── domain/            # ProjectCard, UserTable, etc.
    ├── pages/                 # Route-based pages
    │   ├── auth/              # Login, Register
    │   ├── dashboard/         # Main dashboard
    │   ├── projects/          # Project list & details
    │   └── users/             # User management
    ├── context/               # Global state (AuthContext)
    ├── services/              # API services (Axios instance)
    ├── utils/                 # Utility helpers
    ├── App.js                 # Routing and layout
    └── index.js               # Entry point
```

**Key Folders:**

- **pages/**: Contains six main pages — Registration, Login, Dashboard, Projects List, Project Details, Users List.
- **services/**: Centralized API calls with Axios interceptors to attach JWT tokens.
- **context/**: Manages authentication state and route protection.

---

## 2. Development Setup Guide

### 2.1 Prerequisites

- Node.js v16.x or higher  
- npm v8.x or higher  
- Docker Desktop (latest version — mandatory for evaluation)  
- PostgreSQL v14+ (if running without Docker)

---

### 2.2 Environment Variables

Create a `.env` file inside the `backend/` directory based on `.env.example`.

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres

# Authentication
JWT_SECRET=super_secret_key_minimum_32_characters
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=development

# Frontend Integration
FRONTEND_URL=http://localhost:3000
```

---

### 2.3 Installation Steps

1. **Clone the repository**
```bash
git clone <repo-url>
cd Multi-Tenant-SaaS-Platform
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

---

### 2.4 Run Locally (Without Docker)

1. **Start PostgreSQL**  
   Create a database named `saas_db`.

2. **Run migrations and seeds**
```bash
cd backend
npm run migrate
npm run seed
```

3. **Start backend server**
```bash
npm run dev
# http://localhost:5000
```

4. **Start frontend**
```bash
cd frontend
npm start
# http://localhost:3000
```

---

### 2.5 Run with Docker (Mandatory for Evaluation)

1. Ensure Docker Desktop is running.
2. From the project root:
```bash
docker-compose up -d
```

3. Verify:
- Frontend: http://localhost:3000  
- Backend health: http://localhost:5000/api/health  
- Database: internal port 5432

---

### 2.6 Run Tests

**Backend tests**
```bash
cd backend
npm test
```

- Verifies correct status codes (200, 401, 403)
- Ensures tenant isolation logic