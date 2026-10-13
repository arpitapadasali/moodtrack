# MoodTrack — Mood Tracking & Analytics Platform

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-8.24-880000?logo=mongoose&logoColor=white)](https://mongoosejs.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Tests](https://img.shields.io/badge/Tests-Passing%20(100%25)-success?logo=checkmarx&logoColor=white)](#-testing--quality-assurance)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A full-stack wellness analytics platform designed to empower individuals to record daily moods, reflections, emotions, and sleep patterns, and analyze behavioral trends over time with statistical time-series algorithms and machine learning insights.

---

## 📋 Table of Contents

- [Executive Overview](#-executive-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Database Design & Data Model](#-database-design--data-model)
- [REST API Specification](#-rest-api-specification)
- [Analytics & Mathematical Methodology](#-analytics--mathematical-methodology)
- [Machine Learning Microservice (FastAPI)](#-machine-learning-microservice-fastapi)
- [Weather Co-Occurrence Analytics](#-weather-co-occurrence-analytics)
- [Scheduled Reminder Engine](#-scheduled-reminder-engine)
- [Privacy-Preserving Data Export](#-privacy-preserving-data-export)
- [Authentication & Multi-Layered Security](#-authentication--multi-layered-security)
- [Automated Testing & Quality Assurance](#-automated-testing--quality-assurance)
- [Project Folder Structure](#-project-folder-structure)
- [Setup & Installation Guide](#-setup--installation-guide)
- [Environment Variables Reference](#-environment-variables-reference)
- [User Interface Showcase](#-user-interface-showcase)
- [Future Improvements & Roadmap](#-future-improvements--roadmap)
- [License & Disclaimer](#-license--disclaimer)

---

## 🌟 Executive Overview

In the modern digital lifestyle, understanding one's emotional and physical wellbeing requires consistent reflection backed by meaningful data analysis. **MoodTrack** solves this problem by providing a streamlined, privacy-conscious platform that bridges daily qualitative check-ins with quantitative behavioral analytics.

### Core Objectives
1. **Frictionless Daily Logging:** Quick check-ins capturing 1–5 mood rating, sleep duration in hours, emotional tags, and personal reflections.
2. **Actionable Time-Series Insights:** Rolling 5-vs-5 baseline comparisons, multi-range trend lines, and check-in streaks without obscuring missing data.
3. **Decoupled Machine Learning:** An independent FastAPI microservice running statistical anomaly detection and trend regression over anonymized numerical vectors.
4. **Contextual Enrichment:** Optional weather co-occurrence analysis linking temperature and sky conditions to recorded mood without storing exact GPS coordinates.
5. **Data Sovereignty:** Full RFC 4180 CSV and formatted JSON data export, enabling users to take complete ownership of their wellness records.

> **Non-Clinical Disclaimer:** MoodTrack is a personal reflection and self-monitoring tool. It is strictly **non-diagnostic** and does not make medical or mental health conclusions. All analytics use neutral, data-grounded framing (e.g., *"Your recorded entries show..."*).

---

## 🏛 System Architecture

MoodTrack adopts a modular, microservices-ready multi-tier architecture with strict boundary separation between client presentation, API gateway business logic, document storage, and statistical machine learning computation.

```mermaid
flowchart TD
    subgraph Client ["Frontend Client (React 18 + Vite + Tailwind CSS)"]
        UI["SPA Views (Dashboard, Calendar, Insights, Analytics, Settings)"]
        AuthContext["Auth Context & Token Storage"]
        ToastContext["Toast & Notification System"]
        ChartJS["Chart.js & React-Chartjs-2 Renderers"]
    end

    subgraph Gateway ["Backend API Server (Node.js + Express)"]
        Middleware["Security Pipeline (Helmet, CORS, Rate Limit, Auth JWT)"]
        Controllers["Express Route Controllers"]
        Services["Business Services (Analytics, Weather, Reminders, Export)"]
        Scheduler["Node-Cron Background Engine"]
    end

    subgraph MLService ["Python ML Microservice (FastAPI + Uvicorn)"]
        MLApp["FastAPI Endpoint (/predict)"]
        PatternDetector["Pattern Detector & Trend Regressor"]
    end

    subgraph External ["External Services"]
        OpenWeather["OpenWeatherMap API / Open-Meteo"]
    end

    subgraph Storage ["Database Layer (MongoDB)"]
        Mongoose["Mongoose ODM Models"]
        Mongo[("MongoDB Database / Atlas")]
    end

    UI -->|HTTPS / JSON REST API| Middleware
    Middleware --> Controllers
    Controllers --> Services
    Services -->|Mongoose Queries| Mongo
    Services -->|HTTP / JSON Anonymized Vectors| MLApp
    Services -->|HTTP GET Geocoded Query| OpenWeather
    Scheduler -->|Cron Scan Every Minute| Services
    MLApp --> PatternDetector
```

### Architectural Guarantees
- **Loose Coupling:** The React frontend communicates strictly with the Node.js API Gateway; it has no direct dependency on the Python ML service.
- **Fail-Safe Degradation:** If the Python ML microservice or the OpenWeatherMap API is unreachable, the core Node.js backend handles the failure gracefully with localized fallback responses.
- **Stateless Authentication:** Stateless JWTs signed with HS256 allow horizontal scalability of the API server without session synchronization bottlenecks.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| **Daily Mood Journaling** | Log daily mood score (1: *Very Bad* to 5: *Excellent*), sleep duration (0–24 hrs), multiple feeling tags, and reflections (up to 2,000 characters). |
| **Interactive Calendar** | Monthly calendar view with visual emoji indicators, sleep hours, reflection markers, and single-click inspection of any day. |
| **Multi-Timeframe Charts** | Dual interactive Chart.js visualizations for mood and sleep trends supporting 7-day, 14-day, 30-day, and all-time windows. |
| **5-vs-5 Rolling Comparison** | Compares the user's latest 5 entries against their previous 5 entries to calculate percentage improvements or declines. |
| **Rule-Based Insights** | 10 deterministic behavioral rules identifying sleep-mood correlations, streak milestones, low-mood patterns, and day-of-week habits. |
| **FastAPI ML Microservice** | Anonymized numerical pattern detection evaluating linear trend slope ($m$), Z-score baseline deviations, and cyclic pattern recurrence. |
| **Weather Co-Occurrence** | Discovers correlations between mood and local weather conditions (temperature bands, cloud cover, precipitation) with clear correlation disclaimers. |
| **Automated Reminders** | Timezone-aware daily check-in reminders scheduled via Node-Cron with idempotency checks to prevent duplicate notifications. |
| **Data Export (JSON & CSV)** | Download complete historical wellness data in formatted JSON or RFC 4180 compliant CSV format with sensitive credential scrubbing. |
| **User Profile & Security** | Bcrypt password hashing (12 rounds), JWT authentication, avatar URL selection, password update, and multi-tenant data isolation. |

---

## 💻 Technology Stack

### Frontend Client
- **React 18.3:** Concurrent UI rendering and declarative component architecture.
- **Vite 6.0:** Sub-second HMR bundler optimized for ESM production builds.
- **Tailwind CSS 3.4:** Modern utility-first CSS framework for clean, responsive design.
- **Chart.js 4.5 & React-Chartjs-2 5.3:** Canvas-based interactive data visualizations.
- **Lucide React 1.54:** Consistent, accessible SVG iconography.
- **React Router DOM 6.28:** Client-side declarative routing with protected route wrappers.

### Backend API Server
- **Node.js 18+ & Express 4.21:** High-performance asynchronous HTTP application runtime.
- **MongoDB 7.0+ & Mongoose 8.24:** High-performance document database with flexible ODM schema models, validation, and composite indexes.
- **Node-Cron 3.0:** Scheduled background cron engine for automated reminder execution.
- **Bcryptjs 3.0:** Salted password hashing utilizing 12 adaptive work rounds.
- **JSONWebToken 9.0:** RFC 7519 industry standard token-based authorization.
- **Helmet 8.3 & CORS 2.8:** Comprehensive HTTP security headers and cross-origin resource sharing controls.
- **Express-Rate-Limit 8.7:** IP-based request throttling protecting authentication and export routes.

### Machine Learning Microservice
- **Python 3.13:** Modern high-performance Python runtime.
- **FastAPI 0.115:** Asynchronous ASGI web framework with automatic OpenAPI documentation.
- **Pydantic 2.10:** Robust data parsing and validation for request/response models.
- **Uvicorn 0.34:** Lightning-fast ASGI production web server.
- **NumPy & Scikit-learn:** Efficient vectorized numerical computation and linear regression algorithms.

### Testing & Quality Assurance
- **Node.js Native Test Runner (`node --test`):** Zero-dependency backend testing suite (65 tests).
- **Vitest 5.0 & React Testing Library 16.3:** Fast unit and component test harness running in JSDOM.
- **Pytest 9.1 & FastAPI TestClient:** Robust Python test harness verifying statistical algorithms and endpoints.

---

## 🗄 Database Design & Data Model

The database is built on **MongoDB** using **Mongoose** models with document validation, timestamps, ObjectIds, and compound unique indexes to guarantee that each user can record at most one check-in per calendar date.

```mermaid
erDiagram
    User ||--o{ MoodEntry : "owns (1:N)"
    User ||--o| Reminder : "configures (1:1)"

    User {
        ObjectId _id PK "MongoDB ObjectId"
        String email UK "unique, lowercase, indexed"
        String passwordHash "bcrypt 12-round hash"
        String name "display name"
        String avatar "optional avatar URL"
        Date createdAt "ISO UTC timestamp"
        Date updatedAt "ISO UTC timestamp"
    }

    MoodEntry {
        ObjectId _id PK "MongoDB ObjectId"
        ObjectId userId FK "references User._id, indexed"
        Date entryDate "UTC midnight date"
        Number mood "integer 1 to 5 scale"
        Number sleepHours "0.0 to 24.0 hours"
        Array feelings "array of emotion tag strings"
        String reflection "text notes up to 2000 chars"
        Number temperature "optional ambient temp in Celsius"
        String weatherCondition "optional condition summary"
        Number precipitation "optional precipitation in mm"
        Date createdAt "ISO UTC timestamp"
        Date updatedAt "ISO UTC timestamp"
    }

    Reminder {
        ObjectId _id PK "MongoDB ObjectId"
        ObjectId userId FK "references User._id (unique, indexed)"
        Boolean enabled "default true"
        String reminderTime "HH:mm format (default 20:00)"
        String timezone "IANA identifier (default UTC)"
        Date createdAt "ISO UTC timestamp"
        Date updatedAt "ISO UTC timestamp"
    }
```

### Database Constraints & Indexes
- `MoodEntry`: Compound Unique Index `{ userId: 1, entryDate: 1 }` &mdash; Guarantees exactly one mood check-in per user per date.
- `MoodEntry`: Indexes on `{ userId: 1 }` and `{ entryDate: 1 }` &mdash; Enables high-performance time-series queries.
- `User`: Unique Index `{ email: 1 }` &mdash; Prevents duplicate email accounts.
- `Reminder`: Index on `{ userId: 1 }` &mdash; Fast lookup for user-specific notification preferences.

---

## 🔌 REST API Specification

All authenticated endpoints require an `Authorization: Bearer <JWT>` header. Unauthorized requests respond with `401 Unauthorized`.

| Method | Endpoint | Description | Auth | Success Code |
| :--- | :--- | :--- | :---: | :---: |
| `GET` | `/api/health` | Service health status & connectivity check | None | `200 OK` |
| `POST` | `/api/auth/register` | Register new account (`name`, `email`, `password`) | None | `201 Created` |
| `POST` | `/api/auth/login` | Authenticate user credentials & issue JWT | None | `200 OK` |
| `GET` | `/api/auth/me` | Retrieve profile of authenticated user | Bearer | `200 OK` |
| `PUT` | `/api/auth/profile` | Update profile information (`name`, `email`, `avatar`) | Bearer | `200 OK` |
| `PUT` | `/api/auth/password` | Change password (`currentPassword`, `newPassword`) | Bearer | `200 OK` |
| `POST` | `/api/moods` | Create daily check-in (`mood`, `sleepHours`, `feelings`, `reflection`, `location`) | Bearer | `201 Created` |
| `GET` | `/api/moods/recent` | Fetch recent mood check-ins (limit 11) | Bearer | `200 OK` |
| `GET` | `/api/moods/today` | Fetch today's check-in (or `null` if unrecorded) | Bearer | `200 OK` |
| `GET` | `/api/moods/:date` | Fetch mood check-in for specific `YYYY-MM-DD` | Bearer | `200 OK` |
| `PUT` | `/api/moods/:date` | Update mood check-in for specific `YYYY-MM-DD` | Bearer | `200 OK` |
| `DELETE` | `/api/moods/:date` | Delete mood check-in for specific `YYYY-MM-DD` | Bearer | `200 OK` |
| `GET` | `/api/analytics/summary` | Compute 5-vs-5 rolling baseline comparison | Bearer | `200 OK` |
| `GET` | `/api/analytics/trends` | Time-series data points across 7, 14, 30, or 90 days | Bearer | `200 OK` |
| `GET` | `/api/analytics/streaks` | Compute current streak, longest streak, and total check-in days | Bearer | `200 OK` |
| `GET` | `/api/analytics/calendar` | Fetch monthly calendar entries (`year`, `month` query params) | Bearer | `200 OK` |
| `GET` | `/api/analytics/weather` | Weather co-occurrence correlation analytics | Bearer | `200 OK` |
| `GET` | `/api/insights` | Generate rule-based behavioral insights & metrics | Bearer | `200 OK` |
| `GET` | `/api/insights/ml` | Query Python FastAPI pattern detection microservice | Bearer | `200 OK` |
| `GET` | `/api/reminders` | Fetch reminder preferences (`enabled`, `time`, `timezone`) | Bearer | `200 OK` |
| `PUT` | `/api/reminders` | Update reminder preferences | Bearer | `200 OK` |
| `GET` | `/api/export/json` | Stream complete user history as downloadable JSON | Bearer | `200 OK` |
| `GET` | `/api/export/csv` | Stream complete user history as RFC 4180 CSV | Bearer | `200 OK` |

---

## 📊 Analytics & Mathematical Methodology

### 1. Time-Series Normalization & Missing-Day Handling
A major pitfall in personal health tracking is treating missing days as "zero" (e.g., mood = 0 or sleep = 0 hours). Doing so artificially crashes rolling averages and corrupts trend lines.

**MoodTrack's Rules:**
- **Explicit Calendar Range Expansion:** When generating a trend for $N$ calendar days, the engine produces an entry for every sequential date:
  $$D = \{d_0, d_1, d_2, \dots, d_{N-1}\}$$
- **Missing Day Flagging:** Days with no user entry are explicitly mapped with `hasEntry: false`, `mood: null`, and `sleepHours: null`.
- **Selective Average Calculation:** Averages are calculated strictly over recorded observations ($k \le N$):
  $$\bar{x} = \frac{1}{k} \sum_{i \in \text{recorded}} x_i$$
- **Visual Distinction:** On Chart.js visualizations, missing days are rendered as dashed discontinuous intervals rather than dropping to zero.

---

### 2. Rolling 5-vs-5 Baseline Comparison Algorithm
To determine whether a user's wellbeing is improving or declining without being swayed by a single abnormal day, MoodTrack computes a rolling 5-vs-5 comparative analysis:

1. **Latest Period ($L_5$):** The 5 most recent chronologically recorded entries.
2. **Previous Period ($P_5$):** The 5 entries immediately preceding the latest period (entries 6 through 10).
3. **Delta Computation:**
   $$\Delta_{\text{mood}} = \bar{M}_{L_5} - \bar{M}_{P_5}, \quad \Delta_{\text{sleep}} = \bar{S}_{L_5} - \bar{S}_{P_5}$$
4. **Percentage Shift:**
   $$\%_{\text{shift}} = \left( \frac{\bar{M}_{L_5} - \bar{M}_{P_5}}{\bar{M}_{P_5}} \right) \times 100$$
5. **Trend Classification:**
   - $\Delta_{\text{mood}} \ge +0.3$: **Improving** 📈
   - $\Delta_{\text{mood}} \le -0.3$: **Declining** 📉
   - Otherwise: **Stable** ➡️

---

### 3. Pearson Correlation Coefficient ($r$)
To quantify the statistical relationship between sleep duration ($x$) and mood score ($y$), the engine computes the sample Pearson correlation coefficient:

$$r_{xy} = \frac{\sum_{i=1}^{n} (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum_{i=1}^{n} (x_i - \bar{x})^2} \sqrt{\sum_{i=1}^{n} (y_i - \bar{y})^2}}$$

**Interpretation Thresholds:**
- $r \ge +0.35$ &mdash; *Positive Correlation:* Recorded entries show that higher sleep duration frequently co-occurs with higher mood scores.
- $r \le -0.35$ &mdash; *Negative Correlation:* Recorded entries indicate an inverse co-occurrence.
- $-0.35 < r < +0.35$ &mdash; *Neutral / Insufficient Correlation:* Sleep and mood vary independently in the recorded timeframe.
- **Minimum Data Requirement:** $n \ge 5$ entries. If fewer than 5 entries exist, correlation is withheld to prevent misleading conclusions.

---

### 4. Baseline Deviation & Anomaly Detection (Z-Score)
To detect unusual deviations in mood without hardcoding arbitrary values, the system standardizes entries against the user's historical distribution using the standard Z-score:

$$Z_i = \frac{x_i - \mu}{\sigma}, \quad \text{where } \sigma = \sqrt{\frac{1}{n-1} \sum_{i=1}^{n} (x_i - \mu)^2}$$

- Entries with $|Z_i| \ge 1.5$ are flagged by the ML microservice as statistical deviations from the user's established historical baseline.

---

### 5. Check-In Streak Calculation
- **Current Streak:** Scans backwards starting from today (or yesterday if today has not ended). Increments by 1 for each consecutive recorded calendar day until a missing date is reached.
- **Longest Streak:** Measures the maximum unbroken chain of consecutive calendar dates throughout the user's entire history.
- **Total Check-In Days:** Total unique days on which check-ins were recorded.

---

## 🤖 Machine Learning Microservice (FastAPI)

The Python ML service runs as an isolated microservice on `http://127.0.0.1:8000`.

### Privacy-Preserving Contract
The Node.js backend sanitizes and anonymizes all user data before forwarding it to the Python service. **No personally identifiable information (PII), email addresses, passwords, or reflection texts are ever transmitted to the ML microservice.**

```json
{
  "entries": [
    { "mood": 4, "sleep_hours": 7.5, "day_of_week": 1 },
    { "mood": 5, "sleep_hours": 8.0, "day_of_week": 2 },
    { "mood": 3, "sleep_hours": 6.0, "day_of_week": 3 },
    { "mood": 4, "sleep_hours": 7.0, "day_of_week": 4 },
    { "mood": 4, "sleep_hours": 7.5, "day_of_week": 5 }
  ]
}
```

### Models & Algorithms Evaluated
1. **Ordinary Least Squares (OLS) Linear Trend Slope:** Fits a linear model $y = mx + b$ over recent mood scores. If slope $m > 0.08$, an upward trend is identified; if $m < -0.08$, a downward trend is flagged.
2. **Z-Score Anomaly Detector:** Identifies recent days that diverge by more than 1.5 standard deviations from the user's long-term mean.
3. **Bivariate Correlation Analysis:** Computes Pearson $r$ between sleep and mood.
4. **Day-of-Week Cyclic Pattern Detector:** Groups check-ins by day of the week (Monday through Sunday) to surface weekend vs. weekday behavioral variances.

---

## ⛅ Weather Co-Occurrence Analytics

When a user submits a check-in with an optional location query (e.g., *"San Francisco"*, *"London"*, *"Tokyo"*), the backend queries the OpenWeatherMap API:

1. **Weather Data Ingestion:** Stores only essential meteorological attributes (`weatherTemp`, `weatherCondition`, `weatherIcon`, `weatherHumidity`).
2. **Location Privacy:** The user's exact address or GPS coordinate is **not** persisted.
3. **Co-Occurrence Aggregation:**
   - **Temperature Bands:** Freezing ($<10^\circ\text{C}$), Mild ($10-20^\circ\text{C}$), Warm ($20-30^\circ\text{C}$), Hot ($>30^\circ\text{C}$).
   - **Sky Condition Groups:** Clear, Clouds, Rain, Snow, Atmosphere.
4. **Strict Correlation Disclaimer:** The platform explicitly notes that observed associations represent statistical co-occurrence, **not** causation.

---

## ⏰ Scheduled Reminder Engine

MoodTrack includes a scheduled background reminder system built with `node-cron`:

- **Interval:** Runs every minute (`* * * * *`).
- **Timezone Resolution:** Uses `Intl.DateTimeFormat` with each user's configured IANA timezone (e.g., `America/New_York`, `Asia/Kolkata`, `Europe/London`) to determine current local time.
- **Idempotency & Duplicate Prevention:** Before triggering a reminder, queries the database to verify if a mood entry already exists for "today" in the user's local timezone.
- **Server Restart Resilience:** The reminder engine stores zero transient timers in memory. On every tick, it performs a stateless database scan, ensuring uninterrupted operation across server restarts.
- **Notification Abstraction:** Decoupled `NotificationService` architecture logs reminder dispatches and provides a clean integration point for email, SMS, or web push delivery.

---

## 💾 Privacy-Preserving Data Export

Users can export their complete wellness dataset at any time via the Settings page:

- **JSON Export (`GET /api/export/json`):** Formatted JSON payload containing date, mood, sleep hours, feelings, reflection, and weather parameters.
- **CSV Export (`GET /api/export/csv`):** RFC 4180 compliant tabular CSV with proper comma escaping and quote enclosure.
- **Sensitive Field Scrubbing:** All internal identifiers, `passwordHash`, JWT tokens, and system secrets are strictly excluded from both exports.
- **Multi-Tenant Isolation:** Users can only export their own records; cross-user export requests are strictly rejected.

---

## 🛡 Authentication & Multi-Layered Security

MoodTrack enforces defense-in-depth across six distinct layers:

```
Layer 1: Network & HTTP Security Headers (Helmet, Strict CSP, HSTS, CORS Whitelist)
Layer 2: Rate Limiting & Throttling (Express-Rate-Limit on Auth & Export)
Layer 3: Stateless Authorization (JWT HS256, Expiration Validation, Bearer Tokens)
Layer 4: Cryptographic Credential Protection (Bcrypt 12 Salt Rounds, Timing-Safe Match)
Layer 5: Data Access Isolation (Prisma Parameterization, Multi-Tenant User Filtering)
Layer 6: Input Validation & Sanitization (Strict Length & Type Bounds, Regex Checks)
```

1. **Timing Attack Resistance:** During authentication, failed user lookups execute a dummy bcrypt hash comparison to prevent username enumeration via response-time variance.
2. **SQL Injection Immunity:** All database queries utilize Prisma ORM parameterized statements, eliminating SQL injection vulnerabilities.
3. **Cross-Tenant Guardrails:** Every database mutation and query includes `where: { userId: req.user.id }`, guaranteeing that users cannot view, modify, or delete another user's data.

---

## 🧪 Automated Testing & Quality Assurance

MoodTrack features a test suite of **103 automated tests** spanning the full stack:

```
===================================================================================
TestSuite               Framework               Tests Passing   Coverage Scope
===================================================================================
Backend API             Node.js Native Runner   65 / 65 (100%)  Auth, RBAC, CRUD, Analytics, Export
Frontend Client         Vitest + JSDOM          26 / 26 (100%)  Routes, Forms, Charts, Calendar, Settings
ML Microservice         Pytest + FastAPI        12 / 12 (100%)  Endpoints, Linear Regression, Anomaly
-----------------------------------------------------------------------------------
TOTAL                   3 Test Frameworks       103 / 103 (100%) Full Stack Automated Verification
===================================================================================
```

### Running Backend Tests
```bash
cd backend
npm test
```
*Executes unit and integration suites covering edge cases: 0 entries, 1 entry, 5 entries, 10 entries, missing dates, non-consecutive dates, invalid mood values, expired tokens, and cross-user authorization.*

### Running Frontend Tests
```bash
cd frontend
npm test
```
*Executes Vitest component tests verifying login, registration, mood modal, dashboard, Chart.js graphs, calendar, and settings interactions.*

### Running Python ML Service Tests
```bash
cd ml-service
.venv\Scripts\pytest tests       # Windows
# or: pytest tests              # macOS / Linux
```
*Verifies FastAPI endpoint contracts, Pydantic validation, linear trend regression, and statistical anomaly detection.*

---

## 📁 Project Folder Structure

```text
MoodTrack/
├── frontend/                         # React 18 + Vite client
│   ├── public/                       # Static public assets
│   ├── src/
│   │   ├── assets/                   # Media & icons
│   │   ├── components/               # Modular React components
│   │   │   ├── calendar/             # MoodCalendar, CalendarDayDetail, CalendarMonthStats
│   │   │   ├── common/               # Toast notifications, alert badges
│   │   │   └── dashboard/            # Trend charts, modal, summary cards, sidebar, header
│   │   ├── context/                  # AuthContext, ToastContext
│   │   ├── hooks/                    # useAuth, useToast custom hooks
│   │   ├── layouts/                  # RootLayout with top nav & footer
│   │   ├── pages/                    # Route views (Dashboard, Calendar, Insights, Analytics, Settings)
│   │   ├── services/                 # Axios-like API abstraction layers
│   │   ├── test/                     # Vitest component & integration test suites
│   │   ├── App.jsx                   # React Router route registry
│   │   ├── index.css                 # Tailwind CSS styles
│   │   └── main.jsx                  # Application entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/                          # Node.js + Express API server
│   ├── prisma/
│   │   ├── migrations/               # PostgreSQL migration history
│   │   ├── schema.prisma             # Data schema models (User, MoodEntry, ReminderSetting)
│   │   └── seed.js                   # Database seed script (demo account & realistic mood history)
│   ├── src/
│   │   ├── config/                   # Database client (db.js)
│   │   ├── controllers/              # Route controllers (auth, mood, analytics, export, etc.)
│   │   ├── middleware/               # Auth, rate-limiter, error handling middleware
│   │   ├── routes/                   # Express router definitions
│   │   ├── services/                 # Analytics, weather, ML client, reminders, export logic
│   │   ├── utils/                    # Statistics helpers (Pearson, Z-score, date helpers)
│   │   ├── validators/               # Input validation logic
│   │   ├── app.js                    # Express app configuration
│   │   └── server.js                 # Server entry point & cron engine initializer
│   ├── tests/                        # Backend test suites (65 tests)
│   ├── package.json
│   └── .env.example
│
├── ml-service/                       # Python + FastAPI ML microservice
│   ├── app/
│   │   ├── config.py                 # Port, thresholds, non-clinical disclaimer
│   │   ├── main.py                   # FastAPI application & /predict endpoint
│   │   ├── models.py                 # Pydantic schemas for anonymized vectors
│   │   └── pattern_detector.py       # Statistical models & pattern algorithms
│   ├── tests/                        # Pytest suites (12 tests)
│   ├── requirements.txt              # FastAPI, scikit-learn, numpy, pytest
│   └── run.py                        # Uvicorn server launcher
│
├── .gitignore                        # Global Git ignore rules
└── README.md                         # Comprehensive project documentation
```

---

## 🛠 Setup & Installation Guide

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **MongoDB:** v7.0 or higher (Local community server or MongoDB Atlas cluster)
- **Python:** v3.10 or higher (Optional, for ML microservice)

---

### Step 1: Database Setup (MongoDB)
You can use a local MongoDB instance or MongoDB Atlas:

**Option A: Local MongoDB**
- Start your local MongoDB server (listening on `mongodb://127.0.0.1:27017/moodtrack_db`).
- *Or with Docker:*
  ```bash
  docker run --name moodtrack-mongo -p 27017:27017 -d mongo:7
  ```

**Option B: MongoDB Atlas (Free Cloud Cluster)**
1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Database User with read/write privileges in *Database Access*.
3. Add your IP address (or `0.0.0.0/0`) in *Network Access*.
4. Retrieve your connection string from *Clusters* -> *Connect* -> *Drivers* (Node.js).
   Format:
   ```env
   MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR_CLUSTER.mongodb.net/moodtrack_db?retryWrites=true&w=majority
   ```

---

### Step 2: Backend Setup
```bash
cd backend
npm install

# Copy environment template
cp .env.example .env

# Configure MONGODB_URI and JWT_SECRET in .env

# (Optional) Seed demo user and sample mood data
npm run seed

# Start backend server in development mode
npm run dev
```
*Backend runs on `http://localhost:5000`.*
*Health check endpoint: `http://localhost:5000/api/health`.*

---

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install

# Start Vite development server
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

### Step 4: Python ML Microservice Setup (Optional)
```bash
cd ../ml-service

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start ML microservice
python run.py
```
*ML microservice runs on `http://localhost:8000`.*

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `5000` | Port for Express API server |
| `MONGODB_URI` | **Yes** | `mongodb://127.0.0.1:27017/moodtrack_db` | MongoDB connection URI (Atlas SRV or local connection string) |
| `MONGODB_DB_NAME` | Optional | `moodtrack_db` | Database name to use |
| `JWT_SECRET` | **Yes** | &mdash; | Secret key used for signing HS256 JWT tokens (min 32 chars in production) |
| `JWT_EXPIRES_IN` | Optional | `7d` | Token expiration duration |
| `ML_SERVICE_URL` | Optional | `http://127.0.0.1:8000` | URL for the Python FastAPI ML microservice |
| `WEATHER_API_KEY` | Optional | &mdash; | OpenWeatherMap API key (defaults to Open-Meteo fallback) |
| `CLIENT_URL` | Optional | `http://localhost:5173` | Allowed CORS origin for frontend |

### Frontend (`frontend/.env`)
| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | Optional | `http://localhost:5000/api` | Base URL for the Express backend API |

### ML Microservice (`ml-service/.env`)
| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `8000` | Port for FastAPI Uvicorn server |
| `HOST` | Optional | `127.0.0.1` | Network host binding |

---

## 🖥 User Interface Showcase

### 1. Daily Wellness Overview (`/dashboard`)
- **Today's Mood Banner:** Instant check-in status highlighting today's recorded emoji, feelings, and reflection.
- **Summary Metrics:** Current streak, longest streak, total check-in days, and rolling average mood.
- **Interactive Dual Charts:** Real-time Chart.js visualizations tracking mood and sleep over time.
- **5-vs-5 Comparison Card:** Visual percentage delta comparing latest 5 vs. previous 5 records.

### 2. Interactive Wellness Calendar (`/calendar`)
- **Monthly Grid Matrix:** Complete visual layout of the month with color-coded mood badges and sleep hours.
- **Day Detail Inspector:** Sliding inspector displaying full feelings, sleep duration, reflection note, and edit/delete actions.
- **Month Navigation:** Fluid previous/next month transitions with quick *"Today"* return shortcut.

### 3. Behavioral Insights Hub (`/insights`)
- **Rule-Based Engine:** Category-filtered cards highlighting sleep-mood correlations, streak milestones, and low-mood patterns.
- **FastAPI ML Section:** Visual representation of linear trend regression, Z-score baseline deviations, and cyclic recurrence.
- **Weather Correlation Section:** Temperature band distribution and condition breakdown.

### 4. Account Settings & Data Sovereignty (`/settings`)
- **Profile Customization:** Name, email, and avatar URL selection with live preview.
- **Daily Reminders:** Timezone-aware check-in reminder scheduler.
- **Security:** Password change with current-password verification.
- **Data Export:** Instant one-click export for formatted JSON and RFC 4180 CSV.

---

## 🔮 Future Improvements & Roadmap

- [ ] **Native Mobile Clients:** Cross-platform mobile applications using React Native or Flutter.
- [ ] **End-to-End Encryption (E2EE):** Client-side encryption for personal reflections using Web Crypto API.
- [ ] **Wearable Device Integration:** Direct synchronization with Apple HealthKit, Google Fit, and Garmin for automated sleep and heart-rate tracking.
- [ ] **Web Push Notifications:** Native browser push notifications via Web Push API to complement scheduled background jobs.
- [ ] **Multi-Language Support (i18n):** Complete internationalization for non-English locales.

---

## 📜 License & Disclaimer

This project is licensed under the **MIT License** &mdash; see the [LICENSE](LICENSE) file for details.

**Medical Disclaimer:**
MoodTrack is an informational personal tracking application and is **not intended to provide clinical psychiatric, psychological, or medical diagnosis or treatment**. Users experiencing emotional distress or mental health emergencies should seek support from licensed medical professionals.
