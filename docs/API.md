# API Documentation

**Base URL:** `http://localhost:5000/api`

## 1. Authentication Module

### Register Tenant
Creates a new organization and the initial admin user.
* **Method:** `POST`
* **Endpoint:** `/auth/register-tenant`
* **Auth Required:** No
* **Body:**
    ```json
    {
      "tenantName": "Acme Corp",
      "subdomain": "acme",
      "adminEmail": "admin@acme.com",
      "adminPassword": "password123",
      "adminFullName": "Admin User"
    }
    ```
* **Response:** `201 Created`

### Login
Authenticates a user and returns a JWT token.
* **Method:** `POST`
* **Endpoint:** `/auth/login`
* **Auth Required:** No
* **Body:**
    ```json
    {
      "email": "admin@acme.com",
      "password": "password123",
      "subdomain": "acme"
    }
    ```
* **Response:** `200 OK`
    ```json
    {
      "success": true,
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIsIn...",
        "user": { ... }
      }
    }
    ```

### Get Current User
Retrieves details of the currently logged-in user and their tenant.
* **Method:** `GET`
* **Endpoint:** `/auth/me`
* **Auth Required:** Yes
* **Auth Type:** Bearer Token
* **Response:** `200 OK`

---

## 2. Tenant Management

### Get All Tenants
Lists all registered tenants (Super Admin only).
* **Method:** `GET`
* **Endpoint:** `/tenants`
* **Auth Required:** Yes (Super Admin)
* **Auth Type:** Bearer Token
* **Response:** `200 OK`

### Get Tenant Details
* **Method:** `GET`
* **Endpoint:** `/tenants/:id`
* **Auth Required:** Yes
* **Response:** `200 OK`

---

## 3. User Management

### List Team Members
Retrieves all users belonging to a specific tenant.
* **Method:** `GET`
* **Endpoint:** `/tenants/:tenantId/users`
* **Auth Required:** Yes
* **Response:** `200 OK`

### Add Team Member
Adds a new user to the organization.
* **Method:** `POST`
* **Endpoint:** `/tenants/:tenantId/users`
* **Auth Required:** Yes (Tenant Admin)
* **Body:**
    ```json
    {
      "email": "employee@acme.com",
      "password": "User@123",
      "fullName": "Jane Doe",
      "role": "user"
    }
    ```
* **Response:** `201 Created`

### Update User
* **Method:** `PUT`
* **Endpoint:** `/users/:id`
* **Auth Required:** Yes (Tenant Admin)
* **Body:** `{"fullName": "Updated Name", "role": "tenant_admin"}`
* **Response:** `200 OK`

### Delete User
* **Method:** `DELETE`
* **Endpoint:** `/users/:id`
* **Auth Required:** Yes (Tenant Admin)
* **Response:** `200 OK`

---

## 4. Project Management

### List Projects
Lists all projects for the current tenant.
* **Method:** `GET`
* **Endpoint:** `/projects`
* **Auth Required:** Yes
* **Response:** `200 OK`

### Create Project
* **Method:** `POST`
* **Endpoint:** `/projects`
* **Auth Required:** Yes
* **Body:**
    ```json
    {
      "name": "Website Redesign",
      "description": "Overhaul the main landing page",
      "status": "active"
    }
    ```
* **Response:** `201 Created`

### Get Project Details
* **Method:** `GET`
* **Endpoint:** `/projects/:id`
* **Auth Required:** Yes
* **Response:** `200 OK`

### Update Project
* **Method:** `PUT`
* **Endpoint:** `/projects/:id`
* **Auth Required:** Yes
* **Body:** `{"name": "New Name", "status": "completed"}`
* **Response:** `200 OK`

### Delete Project
* **Method:** `DELETE`
* **Endpoint:** `/projects/:id`
* **Auth Required:** Yes
* **Response:** `200 OK`

---

## 5. Task Management

### List Tasks (By Project)
Retrieves all tasks associated with a specific project.
* **Method:** `GET`
* **Endpoint:** `/projects/:projectId/tasks`
* **Auth Required:** Yes
* **Response:** `200 OK`

### Create Task
* **Method:** `POST`
* **Endpoint:** `/tasks`
* **Auth Required:** Yes
* **Body:**
    ```json
    {
      "projectId": "uuid-of-project",
      "title": "Fix Login Bug",
      "description": "Login fails on mobile",
      "priority": "high",
      "assignedTo": "uuid-of-user"
    }
    ```
* **Response:** `201 Created`

### Update Task Status
Quickly update status (e.g., dragging on a kanban board).
* **Method:** `PATCH`
* **Endpoint:** `/tasks/:id/status`
* **Auth Required:** Yes
* **Body:** `{"status": "in_progress"}`
* **Response:** `200 OK`

### Update Task Details
Update general task info.
* **Method:** `PUT`
* **Endpoint:** `/tasks/:id`
* **Auth Required:** Yes
* **Body:** `{"title": "New Title", "priority": "low"}`
* **Response:** `200 OK`

### Delete Task
* **Method:** `DELETE`
* **Endpoint:** `/tasks/:id`
* **Auth Required:** Yes
* **Response:** `200 OK`

---

## 6. System Health

### Health Check
Used by Docker/Orchestration to verify the backend is running.
* **Method:** `GET`
* **Endpoint:** `/health`
* **Auth Required:** No
* **Response:** `200 OK`