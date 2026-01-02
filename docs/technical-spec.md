# Technical Specification

## 1. Project Structure

This project follows a **monorepo-style structure** containing both backend and frontend services, along with documentation and configuration files.

---

## 1.1 Backend Structure (`/backend`)

The backend is built with **Node.js and Express**, following a **layered architecture**  
(**Controller → Service → Model pattern**).

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

### Key Folders

- **middleware/**  
  Critical for security. Contains:
  - `authMiddleware` (JWT verification)
  - `tenantMiddleware` (injects `tenant_id` into queries)

- **migrations/**  
  Raw SQL files used to create and evolve the database schema.

- **controllers/**  
  Handles the HTTP request lifecycle.  
  All **23 API endpoints** map directly to functions here.

---

## 1.2 Frontend Structure (`/frontend`)

The frontend is a **React application** created using **Create React App (CRA)**.

```text
frontend/
├── Dockerfile                 # Docker build instructions for frontend
├── package.json               # Dependencies
├── public/                    # Static assets (favicon, index.html)
└── src/
    ├── components/            # Reusable UI components
    │   ├── common/            # Navbar, Sidebar, Layout
    │   └── domain/            # ProjectCard, UserTable, etc.
    ├── pages/                 # Route-based pages
    │   ├── auth/              # Login, Register
    │   ├── dashboard/         # Main dashboard (Stats, Quick actions)
    │   ├── projects/          # Project list & details
    │   └── users/             # User management
    ├── context/               # Global state (AuthContext)
    ├── services/              # API services (Axios instance)
    ├── utils/                 # Utility helpers
    ├── App.js                 # Routing and layout
    └── index.js               # Entry point
```

### Key Folders

- **pages/**  
  Contains the main views including:
  - Dashboard grid
  - Project details with task management

- **services/**  
  Centralized API calls using Axios with interceptors to attach JWT tokens.

- **context/**  
  Manages authentication state and route protection.

---

## 2. Execution & Deployment Guide

---

## 2.1 Prerequisites

- **Docker Desktop** (Latest version) — *Required for evaluation*
- **Git**

---

## 2.2 Environment Variables

The project uses a `.env` file for configuration.

- **Docker:** Environment variables are automatically set in `docker-compose.yml`
- **Manual Run:** Create a `.env` file in `backend/` mirroring `.env.example`

### Critical Note on `DB_HOST`

- **Running via Docker:**  
  `DB_HOST=db` (Docker service name)

- **Running Manually:**  
  `DB_HOST=localhost`

---

## 2.3 ✅ Recommended Method: Docker Compose

This is the **most robust and recommended approach**.  
It orchestrates the **Database**, **Backend**, and **Frontend** containers and handles networking automatically.

### Step 1: Build and Start Services

Use the `--build` flag to ensure recent code changes are compiled.

```bash
docker-compose up -d --build
```

### Step 2: Initialize Database

The database container starts empty. Run migrations and seeds inside the backend container.

```bash
# Apply Database Schema
docker exec -it backend npm run migrate

# Populate with Demo Data (Super Admin & Demo Tenant)
docker exec -it backend npm run seed
```

### Step 3: Access Application

- **Frontend:** http://localhost:3000  
- **Backend API:** http://localhost:5000  
- **Database:**  
  - Port: `5432`  
  - User: `postgres`  
  - Password: `postgres`

---

## 2.4 Alternative Method: Local Development (Manual)

Use this method only for local debugging without containers.  
PostgreSQL must be installed locally.

### Steps

1. Start PostgreSQL and create a database named `saas_db`

2. Install Dependencies:
```bash
cd backend && npm install
cd ../frontend && npm install
```

3. Setup Backend:
   - Create `backend/.env` with `DB_HOST=localhost`
   - Run migrations:
     ```bash
     npm run migrate
     ```
   - Run seeds:
     ```bash
     npm run seed
     ```
   - Start server:
     ```bash
     npm run dev
     ```

4. Start Frontend:
```bash
cd frontend
npm start
```

## 2.5 Run Tests

To run the backend test suite (Unit & Integration tests):

### Using Docker (Recommended)

```bash
docker exec -it backend npm test
```

### Running Manually
```bash
cd backend
npm test
```