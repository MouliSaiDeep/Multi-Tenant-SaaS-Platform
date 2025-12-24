# Product Requirements Document (PRD)

## 1. User Personas

### A. Super Admin
* **Role Description:** The supreme administrator of the SaaS platform. This user exists outside of any specific tenant organization and manages the system as a whole.
* **Key Responsibilities:**
    * Monitoring the health and status of all registered tenants.
    * Managing subscription plans and defaults.
    * Auditing system-wide usage and security logs.
* **Main Goals:** Ensure the platform is running smoothly, profitable, and secure. They want to easily onboard new tenants and identify "bad actors" or suspended accounts.
* **Pain Points:** Lack of visibility into how many tenants are active; difficulty in manually updating database records to suspend non-paying tenants.

### B. Tenant Admin
* **Role Description:** The manager or owner of a specific organization (Tenant) that uses the software.
* **Key Responsibilities:**
    * Onboarding team members (creating user accounts).
    * Managing the organization's projects and high-level workflow.
    * Ensuring the team stays within their subscription limits.
* **Main Goals:** Efficiently manage their team's productivity. They want a frictionless way to add users and ensuring that only the right people have access to sensitive projects.
* **Pain Points:** Frustration when hitting user limits without clear warnings; fear of data leaks (e.g., a user seeing data they shouldn't).

### C. End User
* **Role Description:** A regular employee or team member belonging to a Tenant.
* **Key Responsibilities:**
    * Creating and updating tasks.
    * Collaborating on projects.
    * Updating the status of their assigned work items.
* **Main Goals:** Get work done quickly without fighting the software. They need a clean interface to see what is assigned to them and when it is due.
* **Pain Points:** Confusing navigation; inability to find tasks assigned to them; slow system performance.

---

## 2. Functional Requirements

### Authentication Module
* **FR-001:** The system shall allow a new organization to register by providing a Tenant Name, unique Subdomain, and Admin credentials.
* **FR-002:** The system shall verify that the requested subdomain is unique across the entire platform before creation.
* **FR-003:** The system shall allow users to log in using Email, Password, and Tenant Subdomain.
* **FR-004:** The system shall generate a JWT containing `userId`, `tenantId`, and `role` upon successful authentication.

### Tenant Management Module
* **FR-005:** The system shall allow Super Admins to view a paginated list of all tenants, including their status and plan type.
* **FR-006:** The system shall allow Tenant Admins to view their own tenant's details and statistics (user count, project count).
* **FR-007:** The system shall allow Tenant Admins to update their organization's display name.

### User Management Module
* **FR-008:** The system shall allow Tenant Admins to create new user accounts within their tenant.
* **FR-009:** The system shall validate that the current user count does not exceed the Tenant's subscription plan limit (`max_users`) before creating a new user.
* **FR-010:** The system shall allow Tenant Admins to delete users or deactivate their access.
* **FR-011:** The system shall prevent a Tenant Admin from deleting their own account to ensure the tenant always has an administrator.

### Project Management Module
* **FR-012:** The system shall allow users to create new projects with a name, description, and status.
* **FR-013:** The system shall enforce the Tenant's subscription plan limit (`max_projects`) before allowing a project to be created.
* **FR-014:** The system shall allow users to view a list of projects associated **only** with their `tenant_id`.
* **FR-015:** The system shall allow Tenant Admins and Project Creators to soft-delete or archive projects.

### Task Management Module
* **FR-016:** The system shall allow users to create tasks within a specific project.
* **FR-017:** The system shall allow users to assign tasks to other users who belong to the **same** tenant.
* **FR-018:** The system shall allow users to update the status of a task (Todo -> In Progress -> Completed).
* **FR-019:** The system shall record an entry in the `audit_logs` table for every User creation, Project deletion, and Task update.

---

## 3. Non-Functional Requirements

### Performance
* **NFR-001:** The API health check endpoint shall respond within 200ms to ensure container orchestration tools can accurately gauge service health.
* **NFR-002:** Database queries for lists (Projects, Users) shall utilize indexing on `tenant_id` to ensure response times remain under 500ms even as the dataset grows.

### Security
* **NFR-003:** All user passwords must be hashed using `bcrypt` before storage in the database. Plain text passwords shall never be stored.
* **NFR-004:** JWT authentication tokens shall expire automatically after 24 hours, requiring the user to re-authenticate.
* **NFR-005:** The system must strictly enforce Cross-Origin Resource Sharing (CORS) to allow requests only from the trusted frontend domain/container.

### Scalability
* **NFR-006:** The application shall support horizontal scaling of the backend service (stateless architecture) without breaking session logic.

### Availability
* **NFR-007:** The system architecture shall support a 99% uptime target by utilizing Docker container restarts on failure.

### Usability
* **NFR-008:** The frontend application shall be responsive and functional on mobile devices (width < 768px).