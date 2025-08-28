# 📌 Accounting Software – Tech Stack

This document outlines the **frontend** and **backend** frameworks, libraries, and tools used in this project.

---

## 🖥️ Frontend (React + Vite + TypeScript)

### Core Framework

- **React** – UI library
- **Vite** – Fast development build tool
- **TypeScript** – Strongly typed JavaScript

### Styling

- **Tailwind CSS** – Utility-first CSS framework
- **ShadCN UI** _(optional)_ – Prebuilt UI components (tables, forms, modals)
- **Lucide Icons** – Icon set for UI

### Form Management & Validation

- **React Hook Form + Zod** – Essential for accounting forms (invoices, transactions, user input)

### UI Component Libraries

- **ShadCN/UI** – Modern, customizable components (as mentioned in your README)
- **Mantine** – Comprehensive UI library with data tables, date pickers, forms
- **Ant Design** – Enterprise-grade with excellent table/form components

### Data Tables & Grids

- **TanStack Table (React Table v8)** – Powerful table library for financial data
- **AG Grid** – Enterprise-grade data grid (free community version available)

### Date/Time Handling

- **date-fns or Day.js** – Essential for accounting periods, due dates, etc.

### Charts & Visualization

- **Recharts** – Simple React charts for financial dashboards
- **Chart.js with react-chartjs-2** – More powerful charting
- **D3.js** – For complex financial visualizations

### State & Data Fetching

- **React Query (TanStack Query)** – Server state management (API requests, caching, revalidation)
- **Redux Toolkit / Zustand** _(optional)_ – Client state management (user session, UI state)

### Routing

- **React Router v6** – Page navigation

### Supabase Integration

- **@supabase/supabase-js** – Direct communication with Supabase (auth, DB, storage)

---

## ⚙️ Backend (NestJS + Supabase Postgres + Prisma)

### Core Framework

- **NestJS** – Node.js framework for building scalable APIs
- **TypeScript** – Language support

### Database & ORM

- **Supabase (PostgreSQL)** – Managed cloud Postgres
- **Prisma ORM** – Type-safe database access (as planned) - Excellent choice for type-safe database access
- **TypeORM** _(alternative)_ – More traditional ORM approach

### Validation & DTOs

- **class-validator + class-transformer** – Essential for NestJS APIs
- **Joi** _(alternative)_ – Schema validation

### Documentation

- **@nestjs/swagger** – Auto-generate API documentation
- **Compodoc** – Documentation for your NestJS codebase

### Authentication & Security

- **Supabase Auth** – User authentication (email/password, OAuth, magic links)
- **@nestjs/passport + passport-jwt** – JWT authentication
- **@nestjs/throttler** – Rate limiting
- **helmet** – Security headers

### Modules

- **Auth Module** – Wraps Supabase Auth & secures routes
- **Users Module** – Manages user profile & metadata
- **Invoices Module** – Manages invoices & transactions
- **Accounting Rules Module** – Enforces business rules (double entry, period locks, etc.)
- **Audit Logs Module** – Tracks create/update/delete actions

---

## 🚀 Additional Recommendations

### Accounting-Specific Libraries

#### Number/Currency Handling

- **decimal.js or big.js** – Precise decimal arithmetic (crucial for accounting)
- **currency.js** – Currency formatting and calculations

#### PDF Generation

- **jsPDF or PDFKit** – Generate invoices, reports
- **React-PDF** – React components for PDF generation

#### File Processing

- **Papa Parse** – CSV import/export for accounting data
- **xlsx** – Excel file handling

### Development & Quality

#### Testing

- **React Testing Library + Jest** – Frontend testing
- **Supertest** – Backend API testing (already in your setup)
- **MSW (Mock Service Worker)** – API mocking

#### Code Quality

- **Husky + lint-staged** – Pre-commit hooks (as mentioned in README)
- **Prettier** – Code formatting (already configured)
- **Commitizen** – Standardized commit messages

#### Monitoring & Logging

- **Winston or Pino** – Structured logging
- **Sentry** – Error tracking and performance monitoring

### Deployment & Infrastructure

#### Containerization

- **Docker + Docker Compose** – Containerization (as planned)
- **Nginx** – Reverse proxy for production

#### Database Migrations

- **Prisma Migrate** – Database schema versioning
- **Flyway** _(alternative)_ – Database migration tool

---

## 🎨 Animation Guidelines

### Should You Use Animations? YES, but strategically

#### ✅ Benefits for Accounting Software

**User Experience Enhancement**

- Smooth transitions reduce cognitive load
- Visual feedback for form submissions/saves
- Loading states for financial calculations
- Guided user flows for complex processes

**Professional Feel**

- Modern, polished interface
- Competitive with other business software
- Builds user confidence and trust

**Functional Benefits**

- Draw attention to important alerts (overdue invoices, errors)
- Provide feedback for critical actions (payment processed, data saved)
- Help users understand state changes

#### ⚠️ When to Avoid Animations

**Performance-Critical Areas**

- Large data tables with hundreds of transactions
- Real-time financial dashboards
- Complex calculations or reports

**Accessibility Concerns**

- Users with vestibular disorders
- Users who prefer reduced motion
- Older hardware/browsers

#### ✅ DO Animate:

- **Form Interactions** – Focus states, validation feedback
- **Data Loading States** – Skeleton loading, progress indicators
- **Success/Error Feedback** – Confirmation animations, error alerts
- **Navigation & Modals** – Page transitions, modal appearances
- **Interactive Elements**
  - Button hover effects
  - Accordion expansions
  - Tooltip appearances
  - Dropdown menus

#### ❌ DON'T Animate:

**Large Data Tables**

- Sorting/filtering operations
- Pagination changes
- Row selections (unless minimal)

**Financial Calculations**

- Number updates in real-time
- Currency conversions
- Tax calculations

**Critical Actions**

- Delete confirmations (keep them immediate)
- Payment processing (minimize distractions)

### Recommended Animation Framework

- **Motion Framework** – Use Motion from [motion.dev](https://motion.dev/docs/react) for React animations

---

## 🎯 Implementation Priority

### Phase 1 (Essential):

- React Hook Form + Zod
- ShadCN/UI or Mantine
- Prisma ORM
- decimal.js
- class-validator

### Phase 2 (Enhanced Features):

- TanStack Table
- Recharts
- @nestjs/swagger
- Winston logging
- React Testing Library

### Phase 3 (Advanced):

- PDF generation
- File import/export
- Advanced charts
- Monitoring tools

---

## 📦 DevOps & Deployment

- **Docker** – Containerization (frontend + backend + DB)
- **AWS / DigitalOcean / Render** – Hosting options
- **Supabase** – Cloud Postgres + Auth + Storage + Realtime
- **GitHub Actions** _(optional)_ – CI/CD pipeline

---

## 🛠️ Developer Tools

- **Postman / Insomnia** – API testing
- **ESLint + Prettier** – Code linting & formatting
- **Husky + lint-staged** _(optional)_ – Pre-commit hooks

---

## 🔑 Summary

- **Frontend** → React + Vite + TypeScript + Tailwind + React Query + Supabase SDK
- **Backend** → NestJS + Prisma + Supabase Postgres + Passport JWT
- **Deployment** → Docker + Supabase + AWS/DigitalOcean

This stack is **easy to develop**, **modern**, and **scalable** for accounting applications (audit logs, accounting rules, multi-user support).
