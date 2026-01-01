# Multi-Tenant SaaS Platform

A containerized Project Management SaaS platform supporting multiple tenants with strict data isolation. Built with React, Node.js, PostgreSQL, and Docker.

---

## 🚀 Project Overview

The **Multi-Tenant SaaS Platform** is a containerized project management tool designed to serve multiple organizations (tenants) from a single application instance. It utilizes a **Shared Database, Shared Schema** architecture to ensure strict data isolation while maximizing resource efficiency. The platform allows organizations to register, manage team members, and collaborate on projects and tasks securely.

**Target Audience:** Startups and small-to-medium businesses looking for a cost-effective, collaborative project management solution.

- **Architecture:** Shared Database, Shared Schema (Tenant ID discriminator)
- **Isolation:** Strict row-level security using middleware
- **Infrastructure:** Fully containerized 3-tier architecture

---

## 🔑 Key Features

- **Tenant Isolation:** Secure data separation using a `tenant_id` discriminator column
- **Subdomain Support:** Automatic tenant recognition based on login subdomains (e.g., `demo.app.com`)
- **Role-Based Access Control (RBAC):** Super Admin, Tenant Admin, and Standard User roles
- **Secure Authentication:** Stateless JWT authentication with password hashing using `bcrypt`
- **Project Management:** Create, update, and archive projects within a tenant
- **Task Management:** Task tracking with priority levels and user assignments
- **User Management:** Tenant Admins can manage team members and roles
- **Plan Enforcement:** Limits on users and projects based on subscription tiers
- **Automated Seeding:** Scripts to populate demo tenants and initial data
- **Dockerized Deployment:** One-command setup for Frontend, Backend, and Database

---

## 🛠️ Technology Stack

### Frontend
- React.js
- Material UI
- Axios

### Backend
- Node.js
- Express.js
- JWT & bcrypt

### Database
- PostgreSQL 15
- Shared Database, Shared Schema

### Infrastructure
- Docker
- Docker Compose

---

## 🧱 Architecture Overview

The system follows a **3-tier architecture**:

1. **Frontend:** React Single Page Application
2. **Backend:** Node.js / Express REST API
3. **Database:** PostgreSQL with tenant-based isolation

---

## ⚙️ Environment Variables

All environment variables are injected automatically via `docker-compose.yml`.

| Variable | Description |
|--------|-------------|
| DB_HOST | Database container hostname |
| DB_PORT | PostgreSQL port |
| DB_NAME | Application database |
| DB_USER | Database username |
| DB_PASSWORD | Database password |
| JWT_SECRET | JWT signing secret |
| JWT_EXPIRES_IN | Token validity |
| PORT | Backend API port |
| FRONTEND_URL | Frontend origin for CORS |

---

## 📥 Installation & Setup (Docker Only)

### Prerequisites

- Docker Desktop (Installed and running)
- Git

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/MouliSaiDeep/Multi-Tenant-SaaS-Platform
cd "Multi-Tenant SaaS Platform"
```

---

### Step 2: Start the Application

Build and start all services using Docker Compose:

```bash
docker-compose up -d --build
```

Wait ~30 seconds for the database to initialize.  
You should see **"Container database Healthy"** in Docker Desktop.

---

### Step 3: Run Migrations & Seeds

Execute database setup scripts inside the backend container:

```bash
docker exec -it backend npm run migrate
```

```bash
docker exec -it backend npm run seed
```

---

## 🧪 How to Test

### Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

---

### Login Credentials

#### Super Admin (Platform Owner)

- **Email:** superadmin@system.com
- **Password:** Admin@123
- **Subdomain:** (Leave blank)

#### Tenant Admin (Demo Company)

- **Email:** admin@demo.com
- **Password:** Demo@123
- **Subdomain:** demo

---

## 📂 Project Structure

```plaintext
├── backend/
│   ├── migrations/
│   ├── seeds/
│   └── src/
├── frontend/
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Overview

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register-tenant`

### Tenants
- `GET /api/tenants`
- `POST /api/tenants/:id/upgrade`

### Projects
- `GET /api/projects`
- `POST /api/projects`

### Tasks
- `GET /api/projects/:projectId/tasks`
- `POST /api/tasks`

---

## 🔒 Security Measures

- Password hashing using `bcrypt`
- Stateless authentication with JWT
- Strict tenant-based query scoping
- CORS restricted to frontend container

---

## 🎥 Demo Video

[YouTube Link Here]
