# System Architecture & Design

## 1. System Architecture Diagram

The system follows a standard 3-tier architecture containerized with Docker.

**Diagram Description:**

1. **Client:** The user's web browser accessing the application.
2. **Frontend Service:** A React application serving the UI and handling client-side routing.
3. **Backend Service:** A Node.js/Express API that handles business logic, authentication,
and tenancy enforcement.
4. **Database Service:** A PostgreSQL database storing all persistent data.

**Authentication Flow:**

- User logs in via Frontend -> Backend verifies credentials -> Returns JWT.
- Subsequent requests include `Authorization: Bearer <token>`.
- Backend Middleware extracts `tenant_id` from the token to scope all database queries.


## 2. Database Schema Design (ERD)

The database uses a **Shared Database + Shared Schema** approach.

- **Isolation:** The `tenant_id` column acts as the discriminator for isolation.
- **Relationships:** Standard foreign keys with CASCADE delete where appropriate.
- **Indexes:** Indexes are applied to `tenant_id` columns to optimize query performance and isolation checks.


## 3. API Architecture

This API adheres to REST principles. All responses follow the format:

```
{ success: boolean, message: string, data: object }
```

### Module 1: Authentication

| Method | Endpoint | Auth Required | Roles Allowed | Description |
|------|---------|---------------|---------------|-------------|
| POST | /api/auth/register-tenant | No | Public | Register new tenant & admin |
| POST | /api/auth/login | No | Public | User login & token generation |
| GET | /api/auth/me | Yes | All Roles | Get current user & tenant info |
| POST | /api/auth/logout | Yes | All Roles | Logout user |

### Module 2: Tenant Management

| Method | Endpoint | Auth Required | Roles Allowed | Description |
|------|---------|---------------|---------------|-------------|
| GET | /api/tenants | Yes | super_admin | List all tenants (paginated) |
| GET | /api/tenants/:tenantId | Yes | super_admin, Owner | Get tenant details |
| PUT | /api/tenants/:tenantId | Yes | super_admin, tenant_admin | Update tenant details |

### Module 3: User Management

| Method | Endpoint | Auth Required | Roles Allowed | Description |
|------|---------|---------------|---------------|-------------|
| GET | /api/tenants/:tenantId/users | Yes | tenant_admin, user | List users in tenant |
| POST | /api/tenants/:tenantId/users | Yes | tenant_admin | Add user (checks plan limits) |
| PUT | /api/users/:userId | Yes | tenant_admin, Owner | Update user details |
| DELETE | /api/users/:userId | Yes | tenant_admin | Delete user |

### Module 4: Project Management

| Method | Endpoint | Auth Required | Roles Allowed | Description |
|------|---------|---------------|---------------|-------------|
| GET | /api/projects | Yes | All Roles | List projects for tenant |
| POST | /api/projects | Yes | All Roles | Create project (checks limits) |
| PUT | /api/projects/:projectId | Yes | tenant_admin, Creator | Update project |
| DELETE | /api/projects/:projectId | Yes | tenant_admin, Creator | Delete project |

### Module 5: Task Management

| Method | Endpoint | Auth Required | Roles Allowed | Description |
|------|---------|---------------|---------------|-------------|
| GET | /api/projects/:projectId/tasks | Yes | All Roles | List tasks in project |
| POST | /api/tasks | Yes | All Roles | Create task |
| PUT | /api/tasks/:taskId | Yes | All Roles | Update task details |
| PATCH | /api/tasks/:taskId/status | Yes | All Roles | Update task status only |

### System

| Method | Endpoint | Auth Required | Roles Allowed | Description |
|------|---------|---------------|---------------|-------------|
| GET | /api/health | No | Public | Health check (DB connection) |