# Multi-Tenant SaaS Platform

## Project Description
The **Multi-Tenant SaaS Platform** is a containerized project management tool designed to serve multiple organizations (tenants) from a single application instance. It utilizes a **Shared Database, Shared Schema** architecture to ensure strict data isolation while maximizing resource efficiency. The platform allows organizations to register, manage team members, and collaborate on projects and tasks securely.

**Target Audience:** Startups and small-to-medium businesses looking for a cost-effective, collaborative project management solution.

---

## Key Features
* **Tenant Isolation:** Secure data separation using a `tenant_id` discriminator column in a shared PostgreSQL database.
* **Subdomain Support:** Automatic tenant recognition based on login subdomains (e.g., `demo.app.com`).
* **Role-Based Access Control (RBAC):** Distinct permissions for Super Admins, Tenant Admins, and Standard Users.
* **Secure Authentication:** Stateless JWT authentication with secure password hashing using `bcrypt`.
* **Project Management:** Create, update, and archive projects within a specific organization.
* **Task Management:** Granular task tracking with priority levels and user assignments.
* **User Management:** Tenant Admins can add/remove team members and manage roles.
* **Plan Enforcement:** Automated limits on the number of users and projects based on subscription tiers (Free, Pro, Enterprise).
* **Automated Seeding:** Built-in scripts to populate the database with demo tenants and initial data.
* **Dockerized Deployment:** Full 3-tier architecture (Frontend, Backend, Database) orchestrated via Docker Compose.

---

## Technology Stack & Dependencies

### Backend
* **Runtime:** Node.js (v16+)
* **Framework:** Express.js
* **Database Interface:** `pg` (node-postgres)
* **Key Dependencies:**
    * `express`: Web framework for handling API requests.
    * `bcryptjs`: Library for hashing and verifying passwords securely.
    * `jsonwebtoken`: For generating and verifying stateless auth tokens.
    * `dotenv`: Loads environment variables from `.env` file.
    * `cors`: Middleware to enable Cross-Origin Resource Sharing.
    * `helmet`: Security middleware to set HTTP headers.
    * `morgan`: HTTP request logger (optional, for development).

### Frontend
* **Library:** React.js (v18+)
* **Build Tool:** Create React App (CRA) or Vite
* **Key Dependencies:**
    * `react` / `react-dom`: Core UI library.
    * `react-router-dom`: Handles client-side routing and navigation.
    * `axios`: HTTP client for making API requests (with interceptors).
    * `styled-components` (or `css-modules`): For component-level styling.

### Database
* **Database:** PostgreSQL (v14+)
* **Architecture:** Shared Database, Shared Schema

### Infrastructure
* **Containerization:** Docker & Docker Compose

---

## Architecture Overview
The system follows a standard **3-tier architecture**:
1.  **Frontend:** React SPA that communicates with the backend via REST API.
2.  **Backend:** Node.js/Express API that handles business logic, tenant identification, and query scoping.
3.  **Database:** A single PostgreSQL instance storing data for all tenants, isolated via logic.

![Architecture Diagram](./docs/images/system-architecture.png.png)

---

## Environment Variables
Create a `.env` file in the `backend/` directory with the following variables:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `DB_HOST` | Database hostname (service name in Docker) | `database` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `saas_db` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `JWT_SECRET` | Secret key for signing tokens | `super_secret_key_32_chars` |
| `JWT_EXPIRES_IN` | Token validity duration | `24h` |
| `PORT` | API Port | `5000` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |

---

## Installation & Setup

### Prerequisites
* Docker Desktop (Latest version)
* Node.js (v16+) & npm (if running locally without Docker)

### Quick Start (Recommended)
This project is fully containerized. To start the application with seeded data:

1.  **Clone the repository:**
    ```bash
    git clone <repo-url>
    cd Multi-Tenant-SaaS-Platform
    ```

2.  **Start with Docker Compose:**
    ```bash
    docker-compose up --build
    ```
    *This command builds the images, starts the PostgreSQL container, runs migrations, seeds the database, and launches the Frontend and Backend.*

3.  **Access the Application:**
    * Frontend: `http://localhost:3000`
    * Backend API: `http://localhost:5000`
    * Database (Internal): Port `5432`

---

### Manual Local Setup (Without Docker)

1.  **Install Backend Dependencies:**
    ```bash
    cd backend
    npm install
    ```

2.  **Configure Environment:**
    Create a `.env` file in `backend/` (see section above). Set `DB_HOST=localhost`.

3.  **Setup Database:**
    Make sure you have a local Postgres instance running.
    ```bash
    # Run Migrations
    npm run migrate
    
    # Seed Database
    npm run seed
    ```

4.  **Start Backend:**
    ```bash
    npm run dev
    ```

5.  **Start Frontend:**
    ```bash
    cd ../frontend
    npm install
    npm start
    ```

---

## API Documentation
Full documentation is available in [docs/API.md](./docs/API.md).

### Key Endpoints

* **Authentication**
    * `POST /api/auth/login` - User/Admin login
    * `POST /api/auth/register-tenant` - Register a new organization

* **Tenants**
    * `GET /api/tenants` - List all tenants (Super Admin)
    * `POST /api/tenants/:id/upgrade` - Upgrade subscription plan

* **Projects**
    * `GET /api/projects` - List projects for current tenant
    * `POST /api/projects` - Create a new project

* **Tasks**
    * `GET /api/projects/:projectId/tasks` - List tasks for a project
    * `POST /api/tasks` - Create a new task