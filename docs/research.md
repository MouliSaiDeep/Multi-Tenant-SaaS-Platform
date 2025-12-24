# Multi-Tenancy Research & Analysis

## 1. Multi-Tenancy Analysis

Multi-tenancy is a software architecture where a single instance of software runs on a server and serves multiple tenants. A tenant is a group of users who share a common access with specific privileges to the software instance. In the context of this SaaS application, tenants are distinct organizations using the Project Management platform.

We analyzed three primary architectural patterns for implementing multi-tenancy in a relational database environment.

### Approach 1: Shared Database, Shared Schema
In this approach, all tenants share the same database and the same tables. Every table that contains tenant-specific data has a discriminator column, typically `tenant_id`, which associates the record with a specific tenant.

* **Architecture:** A single database instance houses all data. Queries must always include a `WHERE tenant_id = X` clause to ensure data isolation.
* **Pros:**
    * **Lowest Cost:** Requires the least amount of infrastructure resources. Only one database instance needs to be maintained, backed up, and scaled.
    * **Easy Maintenance:** Database schema changes (migrations) only need to be run once for all tenants.
    * **Efficient Resource Utilization:** Storage and compute resources are pooled, accommodating "bursty" traffic from different tenants effectively.
    * **Simplified Onboarding:** Adding a new tenant is as simple as inserting a row into a `tenants` table; no infrastructure provisioning is required.
* **Cons:**
    * **Isolation Risk:** Data isolation relies entirely on application logic. A developer error (forgetting a `WHERE` clause) can lead to data leakage between tenants.
    * **Performance Bottlenecks:** "Noisy neighbor" effect where one heavy-usage tenant slows down the database for everyone else.
    * **Backup/Restore Complexity:** Restoring data for a single tenant is difficult because their data is intermingled with others.

### Approach 2: Shared Database, Separate Schemas
In this model, all tenants share the same physical database instance, but each tenant has their own logical schema (namespace).

* **Architecture:** The database contains multiple schemas (e.g., `tenant_a`, `tenant_b`). Tables are duplicated in each schema. The application connects to the specific schema associated with the tenant context.
* **Pros:**
    * **Better Isolation:** Data is logically separated at the database level, reducing the risk of accidental application-level leaks.
    * **Customization:** Easier to support per-tenant schema customizations if required in the future.
    * **Moderate Cost:** Still shares the same physical resources (CPU, RAM), keeping infrastructure costs lower than separate databases.
* **Cons:**
    * **Migration Complexity:** Schema changes must be applied to *every* tenant schema individually. If a migration fails for one tenant, the system enters an inconsistent state.
    * **Overhead:** Database overhead increases significantly with the number of tenants. Postgres, for example, may struggle with thousands of schemas due to metadata tracking.

### Approach 3: Separate Databases (Database-per-Tenant)
This is the highest level of isolation where each tenant gets their own dedicated database instance.

* **Architecture:** The application maintains a pool of connections or spins up new connections to distinct databases based on the tenant.
* **Pros:**
    * **Maximum Isolation:** Physical separation ensures that data leakage is virtually impossible.
    * **Security:** High-security tenants can have their databases encrypted with different keys or hosted in different regions (GDPR compliance).
    * **No "Noisy Neighbors":** Heavy load on one tenant does not impact others.
* **Cons:**
    * **High Cost:** Significant infrastructure overhead. You pay for the base resource footprint of a database for every single tenant, even if they are inactive.
    * **Operational Complexity:** Managing backups, monitoring, and updates for hundreds or thousands of databases is operationally intensive.
    * **Aggregation Difficulty:** Running analytics queries across all tenants (e.g., "Total active users on platform") is extremely difficult and slow.

### Comparison Table

| Feature | Shared Database, Shared Schema | Shared Database, Separate Schema | Separate Database |
| :--- | :--- | :--- | :--- |
| **Isolation Level** | Low (Logical/Application) | Medium (Schema) | High (Physical) |
| **Infrastructure Cost** | Low | Low/Medium | High |
| **Scalability (Tenants)** | High (Vertical scaling of DB) | Medium (Schema overhead) | Medium (Horizontal complexity) |
| **Maintenance** | Easy (1 migration) | Moderate (N migrations) | Hard (N databases to manage) |
| **DevOps Complexity** | Low | Medium | High |
| **Resource Efficiency** | High | Medium | Low |
| **Disaster Recovery** | Hard (Single tenant restore) | Medium | Easy (Per-tenant restore) |

### Justification for Chosen Approach
For this project, we have selected the **Shared Database + Shared Schema** approach.

**Reasoning:**
1.  **Complexity vs. Requirements:** The project requirements specify a SaaS platform with Pro/Enterprise limits but do not require HIPAA/PCI-level physical isolation. The overhead of managing separate containers or schemas for a submission-based evaluation is unnecessary.
2.  **Scalability for Startups:** This architecture is the standard for early-stage SaaS startups. It minimizes costs and allows for rapid iteration of the data model without complex migration scripts.
3.  **Ease of Evaluation:** Using a single Postgres instance in Docker makes the application highly portable and ensures the `docker-compose up -d` requirement is robustly met without complex initialization scripts that create dynamic schemas.
4.  **Mitigation of Cons:** We will address the isolation risk by implementing a robust "Tenant Isolation Middleware" in the backend. This middleware will automatically extract the `tenant_id` from the JWT and inject it into the request context, ensuring that developers do not need to manually parse it for every controller.

---

## 2. Technology Stack Justification

### Backend Framework: Node.js with Express
We selected **Node.js** running the **Express** framework.
* **Why:** Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient, perfect for data-intensive real-time applications that run across distributed devices. Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. Its middleware architecture is ideal for implementing our specific multi-tenancy logic (JWT verification and tenant context injection) cleanly before requests hit the business logic.
* **Alternatives Considered:**
    * *Python (Django/Flask):* Django is excellent but heavy ("batteries included"). Its ORM is opinionated, which can make implementing custom multi-tenancy logic (like automatically scoping queries) harder than with a more flexible JS ecosystem.
    * *Go (Golang):* Offers high performance but has a steeper learning curve and more verbose code for simple CRUD operations compared to Node.js.

### Frontend Framework: React
We selected **React**.
* **Why:** React's component-based architecture allows us to build encapsulated components that manage their own state, then compose them to make complex UIs. For a dashboard application like this (Projects, Tasks, Users lists), React's Virtual DOM ensures efficient updates. The extensive ecosystem (React Router, Context API) makes managing global state—like the current user's role and tenant ID—seamless.
* **Alternatives Considered:**
    * *Vue.js:* A strong contender and very approachable, but React's strict one-way data flow often leads to more predictable code in larger applications with complex state management needs (like RBAC).
    * *Angular:* Too heavy and opinionated for the scope of this project.

### Database: PostgreSQL
We selected **PostgreSQL**.
* **Why:** Postgres is the industry standard for reliable relational data storage. It offers full ACID compliance, which is critical for transaction-heavy operations like Tenant Registration (where we must create a Tenant and an Admin User simultaneously). Postgres also has excellent support for indexing and JSONB types, allowing flexibility if we need to store unstructured settings for tenants in the future.
* **Alternatives Considered:**
    * *MySQL:* A valid option, but Postgres generally offers better compliance with SQL standards and more advanced features (like Row Level Security) that are beneficial for multi-tenancy.
    * *MongoDB:* Rejected because the data model (Tenants -> Projects -> Tasks) is highly relational. Ensuring data integrity and cascades (e.g., deleting a tenant deletes all projects) is much harder in a NoSQL document store.

### Authentication Method: JWT (JSON Web Tokens)
We selected **stateless JWT authentication**.
* **Why:** In a multi-tenant system, we need to know *who* the user is and *which tenant* they belong to with every request. JWTs allow us to encode the `userId`, `tenantId`, and `role` directly into the token payload. This means the backend can verify access permissions without needing to query the database for session data on every single API hit, significantly reducing database load.
* **Alternatives Considered:**
    * *Session-based Auth (Cookies):* Requires server-side storage (Redis or DB) to track active sessions. This introduces statefulness to the API, making it harder to scale horizontally and adding a dependency (Redis) that increases Docker complexity.

### Deployment Platform: Docker & Docker Compose
We selected **Docker** for containerization.
* **Why:** Docker guarantees that the software will run the same way in the evaluation environment as it does in development. It eliminates "it works on my machine" issues by packaging dependencies (Node version, Database configuration) into the container. Docker Compose allows us to orchestrate the multi-container application (Frontend, Backend, Database) with a single command, satisfying the core project requirement.

---

## 3. Security Considerations

Multi-tenant applications face unique security challenges because multiple clients' data resides in the same system. We will implement the following measures:

### 1. Security Measures for Multi-Tenant Systems
1.  **Logical Data Isolation:** Preventing cross-tenant data access is the highest priority. We will strictly enforce `tenant_id` checks on every database query.
2.  **Role-Based Access Control (RBAC):** We will distinguish between `super_admin`, `tenant_admin`, and `user`. API endpoints will have middleware guards (e.g., `authorize('tenant_admin')`) to ensure users cannot perform actions outside their privilege level.
3.  **Input Validation & Sanitization:** All incoming data will be validated against strict schemas (e.g., ensuring email formats, checking UUID validity) to prevent injection attacks.
4.  **Rate Limiting:** To prevent a single tenant from degrading the service for others (DoS), we will implement API rate limiting.
5.  **Secure Headers:** We will use Helmet.js to set secure HTTP headers (HSTS, X-Frame-Options, X-XSS-Protection) to prevent common browser-based attacks.

### 2. Data Isolation Strategy
Since we are using a Shared Schema approach, isolation is enforced at the application layer (Backend).
* **Middleware:** We will implement a `tenantIsolation` middleware that runs after authentication. It extracts the `tenantId` from the decrypted JWT.
* **Query Scope:** This `tenantId` is injected into the request object (`req.tenantId`). All controller functions must use this ID in their SQL `WHERE` clauses (e.g., `WHERE project.id = :id AND project.tenant_id = :tenantId`).
* **Defense in Depth:** We will never trust a `tenantId` sent in the request body (e.g., JSON payload) for identification purposes; we only trust the ID signed within the JWT.

### 3. Authentication & Authorization Approach
* **Authentication:** We use JWTs signed with a strong 256-bit secret key. Tokens have a short lifespan (24 hours).
* **Authorization:** We implement a hierarchical permission system.
    * `Super Admin`: Can access all routes, including global tenant management.
    * `Tenant Admin`: Can access all routes scoped to their specific `tenantId`.
    * `User`: Can access read/write routes for Projects and Tasks but is restricted from User Management routes.

### 4. Password Hashing Strategy
We will strictly avoid storing plain-text passwords.
* **Algorithm:** We will use **bcrypt** for hashing. It is a slow hashing algorithm designed to be resistant to rainbow table attacks and brute-force attempts.
* **Implementation:** When a user registers, we generate a salt and hash the password (`bcrypt.hash(password, saltRounds)`). During login, we compare the input password against the stored hash (`bcrypt.compare()`). We will use a work factor (salt rounds) of 10 or 12 to balance security and performance.

### 5. API Security Measures
* **HTTPS:** In production, all traffic must be encrypted via TLS/SSL.
* **CORS:** Cross-Origin Resource Sharing will be configured to only allow requests from the specific frontend domain (or the frontend Docker service).
* **Audit Logging:** We will maintain an immutable `audit_logs` table. Every critical state change (creating a user, deleting a project) will record the `user_id`, `tenant_id`, `action`, `ip_address`, and `timestamp`. This provides a trail for forensic analysis if a security incident occurs.