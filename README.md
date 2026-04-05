<div align="center">
  <br />
    <h1 align="center">Finance Data Processing & Access Control Backend</h1>
<br />
</div>


## <a name="introduction">✨ Introduction</a>
A robust backend system for managing financial records with role‑based access control, built with **Node.js + Express + MongoDB**


**Important Note:**

- Financial systems typically benefit from relational databases because of ACID compliance and structured schema design.
-  In this implementation, MongoDB was chosen for rapid development, but I have experience working with relational databases and understand their advantages for such use cases.

## <a name="Core-featuere">Core Features </a>
-  User & Role Management (Viewer, Analyst, Admin)
-  Financial Records CRUD (with soft delete)
-  Dashboard Summary APIs (income, expenses, trends, categories)
-  Access Control Logic (middleware‑based)
-  Input Validation & Error Handling
-  Data Persistence (MongoDB)

## <a name="Additional-featuere">Additional Features </a>
- JWT Authentication
-  Pagination for listings
-  Search (by description)
-  Filtering (by type, category, date range)
-  Soft Delete (records & users)
-  Rate Limiting (100 requests/15min per IP)
-  Unit & Integration Tests (Jest + Supertest)
-  API Documentation (Swagger UI)

## <a name="Table of Contents">Table of Contents </a>

- [Tech Stack](#-tech-stack)
- [Installation](#️-setup-instructions)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [API Endpoints](#api-endpoints)
- [Role-Based Access](#role-based-access)
- [Project Structure](#project-structure)
- [Assumptions](#assumptions)
- [Error Handling](#error-handling)

## <a name="Tech Stack">🛠 Tech Stack </a>


| Layer       | Technology                     |
|-------------|--------------------------------|
| Runtime     | Node.js                  |
| Framework   | Express.js                     |
| Database    | MongoDB (Mongoose ODM)         |
| Auth        | JWT + bcryptjs                 |
| Validation  | express-validator              |
| Rate Limit  | express-rate-limit             |
| Testing     | Jest + Supertest               |
| Docs        | Swagger UI + swagger-jsdoc     |

## <a name="Setup Instructions">⚙️ Setup Instructions</a>


1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
     https://github.com/Amit-yadav099/CollEdge-Connect-work.git
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    ```
   
    **Create .env file in the main root directory :**
    ```bash
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/finance_db
     JWT_SECRET=your_super_secret_key_change_this
     JWT_EXPIRES_IN=7d
     NODE_ENV=development
    ```

3.  **Run the Server:**
    
    Start the backend Server
    ```bash
    cd backend
    npm run dev
    # Server runs on http://localhost:5000
    ```

## <a name="API Documentation">📚 API Documentation</a>    
Once the server is running, access the interactive Swagger documentation at:
```bash
http://localhost:5000/api-docs
```

## <a name="Testing">Testing</a>    
  ```bash
  # Run all tests
  npm test

  # Run specific test file
  npm test -- auth.test.js
  ```
**Tests are located in src/tests/ and cover:**

- Authentication (register/login)

- Record CRUD operations

- Dashboard summary

- Role-based access control

## <a name="API Endpoints">API Endpoints</a>

**All endpoints (except /auth/register and /auth/login) require a Bearer token in the Authorization header:**

```
Authorization: Bearer <your_jwt_token>
```
<br>

**Authentication**

| Method | Endpoint              | Description             | Access |
|--------|----------------------|-------------------------|--------|
| POST   | /api/auth/register   | Register new user       | Public |
| POST   | /api/auth/login      | Login & get token       | Public |

<br>

Register body example:
```bash
{
  "name": "RootUser",
  "email": "user@example.com",
  "password": "123456",
  "role": "viewer"       // optional, defaults to "viewer"
}
```

Login body example:
```bash
{
  "email": "user@example.com",
  "password": "123456"
}
```

**User Management (Admin only)**

| Method | Endpoint         | Description                          |
|--------|------------------|--------------------------------------|
| GET    | /api/users       | Get all users (paginated)           |
| POST   | /api/users       | Create a new user                   |
| PUT    | /api/users/:id   | Update user (role, active, etc.)    |
| DELETE | /api/users/:id   | Soft delete user                    |

<br>

Query parameters for GET /api/users:

- page (default 1)

- limit (default 10)

- search (name or email)
<br>
<br>


**Financial Records**

| Method | Endpoint            | Description                     | Allowed Roles              |
|--------|---------------------|---------------------------------|----------------------------|
| GET    | /api/records        | List records (with filters)     | Viewer, Analyst, Admin     |
| POST   | /api/records        | Create a new record             | Analyst, Admin             |
| PUT    | /api/records/:id    | Update a record                 | Analyst, Admin             |
| DELETE | /api/records/:id    | Soft delete a record            | Analyst, Admin             |

Query parameters for GET /api/records:

- page, limit (pagination)

- type (income/expense)

- category

- startDate, endDate (ISO format)

## <a name="Dashboard Summary">Dashboard Summary</a>


| Method | Endpoint            | Description                     | Allowed Roles              |
|--------|---------------------|---------------------------------|----------------------------|
| GET    | /api/dashboard       | Get aggregated financial summaries     | Viewer, Analyst, Admin     |


**Response includes:**

- totalIncome

- totalExpenses

- netBalance

- categoryTotals (per category & type)

- recentActivity (last 5 records)

- monthlyTrends (last 6 months)

## <a name="🎭 Role-Based Access Control">🎭 Role-Based Access Control</a>


| Action                          | Viewer | Analyst | Admin |
|----------------------------------|--------|---------|-------|
| View records & dashboard         | ✅     | ✅      | ✅    |
| Create/update/delete records     | ❌     | ✅*     | ✅    |
| Manage users (CRUD)              | ❌     | ❌      | ✅    |

<br>

**Analyst can modify their own records (configurable). Admin can modify any 
record.**

Middleware implementation:
- protect – verifies JWT and attaches user to req.user

- allowRoles(...roles) – checks if user role is allowed


## <a name="Project">Project Structure</a>
``` bash
finance-backend/
├── .env
├── .gitignore
├── package.json
├── README.md
├── src/
│   ├── app.js                 # Express app setup
│   ├── server.js              # Entry point
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/
│   │   ├── User.js            # User schema (soft delete, hashing)
│   │   └── FinancialRecord.js # Record schema
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── recordController.js
│   │   └── dashboardController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── recordRoutes.js
│   │   └── dashboardRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── validationMiddleware.js
│   │   ├── rateLimiter.js
│   │   └── errorMiddleware.js
│   └── tests/
│       ├── auth.test.js
│       ├── records.test.js
│       └── dashboard.test.js
```
## <a name="Assumptions & Design Choice">Assumptions & Design Choice</a>
- Roles – Simple three‑tier (viewer, analyst, admin). Extensible.

- Soft Delete – Implemented via deletedAt field. All find queries automatically exclude deleted documents using Mongoose pre‑hooks.

- Record Ownership – Analyst can update/delete any record (simplified). In a real app, you might restrict to only their own.

- Rate Limiting – Global limit of 100 requests per 15 minutes per IP to prevent abuse.

- Validation – Uses express-validator for declarative rules.

- Error Handling – Central middleware catches all errors and returns consistent JSON.

- Testing – Uses in‑memory MongoDB or separate test database (configure via .env.test)



