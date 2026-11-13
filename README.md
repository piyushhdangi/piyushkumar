# Smart Campus Lost & Found System — Sir Padampat Singhania University (SPSU), Udaipur

A centralized university Lost & Found platform built for **Sir Padampat Singhania University (SPSU), Udaipur** students, faculty, staff, and proctor administrators to report lost belongings, log found items, search and filter active reports, verify ownership claims, and audit item recovery.

---

## 1. SPSU Demo Accounts (For Testing & Viva Evaluation)

| Role | Name | Email | Password | School / Department |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Dr. Rajeshwar Singh | `admin@spsu.ac.in` | `Admin@123` | SPSU Proctor & Security Office |
| **Staff** | Vikramaditya Rathore | `staff@spsu.ac.in` | `Staff@123` | SPSU Central Library |
| **Student** | Aarav Sharma | `student@spsu.ac.in` | `Student@123` | School of Engineering (B.Tech CSE) |
| **Student** | Ananya Mewara | `ananya.mewara@spsu.ac.in` | `Student@123` | School of Management (BBA) |

---

## 2. Project Architecture & Directory Structure

```text
smart-campus-lost-found/
├── backend/
│   ├── config/
│   │   └── db.ts               # MySQL2 connection pool + relational persistence engine
│   ├── middleware/
│   │   └── auth.ts             # Session token/cookie authentication & RBAC middleware
│   ├── routes/
│   │   └── apiRoutes.ts        # REST API controllers & routes (/api/auth, /api/items, /api/claims, /api/admin)
│   └── uploads/                # Validated uploaded item photographs
├── database/
│   ├── schema.sql              # Complete MySQL 8.0+ DDL schema (Users, Items, Claims, StatusHistory)
│   └── seed.sql                # Realistic demo accounts, 6 campus items, claims, and audit logs
├── src/
│   ├── assets/images/          # High-resolution campus item photographs
│   ├── components/             # Modular UI views (Landing, Explore, Dashboard, Report, Admin, Modals)
│   ├── services/
│   │   └── api.ts              # Fetch API client with session token management
│   ├── utils/
│   │   ├── campusLogic.ts      # Pure validation, privacy masking, filtering, and duplicate detection
│   │   └── campusLogic.test.ts # Automated Node test suite
│   ├── App.tsx
│   └── index.css
├── server.ts                   # Express + Vite full-stack server on Port 3000
└── .env.example                # Environment configuration template
```

---

## 3. MySQL Database Setup & Local Execution Instructions

### Step 1: Initialize MySQL Database (Local MySQL 8.0+ / MariaDB)
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` and set your MySQL credentials:
```env
MYSQL_HOST="127.0.0.1"
MYSQL_PORT="3306"
MYSQL_USER="root"
MYSQL_PASSWORD="your_mysql_password"
MYSQL_DATABASE="smart_campus_lost_found"
SESSION_SECRET="campus_lost_found_secure_session_key_2026"
```
*(Note: When running in cloud container sandboxes without a local MySQL daemon, `backend/config/db.ts` automatically falls back to a persistent file-backed relational store initialized with the exact same schema and seed data).*

### Step 3: Install Dependencies & Run Server
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### Step 4: Run Unit Tests
```bash
npx tsx --test src/utils/campusLogic.test.ts
```
