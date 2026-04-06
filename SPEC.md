# RevAudit — Revenue Leakage Detection System

## Project Overview

- **Project Name**: RevAudit
- **Type**: Production-grade SaaS Platform
- **Core Functionality**: Compare expected revenue (from contract rules) vs actual revenue (from billing data) to detect leakage, underbilling, and rule violations
- **Target Users**: CFOs, Finance Directors, Revenue Operations teams at enterprise companies
- **Tech Stack**: Next.js (App Router), Node.js API routes, PostgreSQL, Prisma ORM, NextAuth (credentials auth), Tailwind CSS

---

## Database Schema (Prisma)

### Models

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())
  clients   Client[]
}

model Client {
  id        String   @id @default(cuid())
  userId    String
  name      String
  industry  String?
  createdAt DateTime  @default(now())
  user      User     @relation(fields: [userId], references: [id])
  contracts Contract[]
  billings  BillingRecord[]
  audits   AuditResult[]
}

model Contract {
  id          String        @id @default(cuid())
  clientId    String
  name        String
  description String?
  createdAt   DateTime     @default(now())
  client      Client       @relation(fields: [clientId], references: [id])
  rules       ContractRule[]
}

model ContractRule {
  id         String   @id @default(cuid())
  contractId String
  type       RuleType
  name       String
  condition  Json
  value      Json
  priority   Int      @default(0)
  startDate  DateTime?
  endDate    DateTime?
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  contract   Contract @relation(fields: [contractId], references: [id])
}

model BillingRecord {
  id           String   @id @default(cuid())
  clientId     String
  amountCharged Float
  units        Float?
  description String?
  billingDate DateTime
  createdAt   DateTime @default(now())
  client      Client   @relation(fields: [clientId], references: [id])
}

model AuditResult {
  id             String      @id @default(cuid())
  clientId       String
  billingRecordId String?
  contractId     String?
  expectedAmount Float
  actualAmount   Float
  difference     Float
  issueType      IssueType
  details        Json?
  createdAt      DateTime    @default(now())
  client         Client      @relation(fields: [clientId], references: [id])
}

enum RuleType {
  TIERED
  FLAT
  MINIMUM
  DISCOUNT
  TIME_BASED_DISCOUNT
}

enum IssueType {
  UNDERCHARGE
  OVERCHARGE
  MISSED_BILLING
  EXPIRED_DISCOUNT
  RULE_VIOLATION
}
```

---

## UI/UX Specification

### Layout Structure

- **Sidebar**: Fixed left sidebar (280px) with navigation links, user info, logout
- **Header**: Top bar (64px) with page title, search, notifications, user menu
- **Content Area**: Main content with proper padding (24px)
- **Responsive**: Collapsible sidebar on mobile (<768px)

### Visual Design

#### Color Palette (Dark Mode Enterprise)
- **Background Primary**: `#0a0a0f` (near black)
- **Background Secondary**: `#12121a` (dark navy)
- **Background Tertiary**: `#1a1a24` (elevated surfaces)
- **Background Hover**: `#22222e` (hover states)
- **Border**: `#2a2a36` (subtle borders)
- **Border Active**: `#3d3d4d` (active borders)
- **Text Primary**: `#f0f0f5` (white-ish)
- **Text Secondary**: `#a0a0b0` (muted)
- **Text Tertiary**: `#606070` (disabled)
- **Accent Primary**: `#3b82f6` (blue - primary actions)
- **Accent Success**: `#10b981` (green - positive)
- **Accent Warning**: `#f59e0b` (amber - warnings)
- **Accent Error**: `#ef4444` (red - errors/negative)
- **Accent Purple**: `#8b5cf6` (purple - special)

#### Typography
- **Font Family**: `Inter, system-ui, sans-serif`
- **Headings**:
  - H1: 28px, font-weight 600
  - H2: 22px, font-weight 600
  - H3: 18px, font-weight 500
  - H4: 15px, font-weight 500
- **Body**: 14px, font-weight 400, line-height 1.6
- **Small**: 12px, font-weight 400
- **Mono**: `JetBrains Mono, monospace` for numbers

#### Spacing System
- Base unit: 4px
- Common spacing: 8px, 12px, 16px, 24px, 32px, 48px
- Card padding: 20px
- Section gap: 24px

#### Visual Effects
- **Border radius**: 6px (buttons), 8px (cards), 12px (modals)
- **Shadows**: `0 4px 24px rgba(0,0,0,0.4)` (elevated)
- **Transitions**: 150ms ease-out (all interactions)

### Components

#### Navigation Sidebar
- Logo at top
- Nav items with icons: Dashboard, Clients, Contracts, Billing, Audit, Settings
- Active state: accent background, white text
- Hover: subtle background change
- User info at bottom

#### Data Tables
- Striped rows with alternating backgrounds
- Sortable columns with indicators
- Fixed header on scroll
- Row hover highlight
- Action buttons on row hover
- Pagination controls
- Bulk selection checkboxes

#### Metric Cards
- Large number display (mono font)
- Trend indicator (up/down arrow with percentage)
- Subtitle explanation
- Subtle border
- Icon indicator

#### Forms
- Label above input
- Error state with red border
- Helper text below
- Required indicator (*)
- Select dropdowns with custom styling

#### Buttons
- Primary: Blue background, white text
- Secondary: Ghost/outline style
- Danger: Red for destructive actions
- Size variants: sm, md, lg

#### Status Badges
- Undercharge: Red background
- Overcharge: Orange background
- Missed: Yellow background
- OK: Green background

---

## Functionality Specification

### 1. Authentication

- Login page with email/password
- Session management with NextAuth
- Protected routes
- Logout functionality

### 2. Dashboard

- Total Revenue Leakage (ZAR) - large metric
- Breakdown cards:
  - Underbilling total
  - Overbilling total
  - Missed charges total
- Top 5 leaking clients table
- Recent audit results table
- Insights panel:
  - "You lost R___ due to expired discounts"
  - "Top 3 clients account for 72% of leakage"

### 3. Clients Management

- Client list table with search, filter, sort
- Add new client form
- Edit client details
- View client details with related contracts and billing history
- Delete client (with confirmation)

### 4. Contracts Management

- Contract list grouped by client
- Add/edit contract form
- Contract rules editor:
  - Rule type selector
  - JSON condition editor (validated)
  - Value input (numeric or JSON)
  - Date range picker
  - Priority setting
- Activate/deactivate rules

### 5. Billing Records

- CSV upload with column mapping
- Manual entry form
- Billing history table with filters
- Edit/delete records

### 6. Rule Engine (Deterministic)

#### Tiered Pricing
```json
{
  "type": "TIERED",
  "condition": { "field": "units", "thresholds": [0, 100, 500, 1000] },
  "value": { "rates": [10, 8, 6, 5] }
}
```

#### Flat Rate
```json
{
  "type": "FLAT",
  "condition": {},
  "value": { "rate": 15 }
}
```

#### Minimum Charge
```json
{
  "type": "MINIMUM",
  "condition": { "field": "billingPeriod", "value": "monthly" },
  "value": { "minimum": 500 }
}
```

#### Time-based Discount
```json
{
  "type": "TIME_BASED_DISCOUNT",
  "condition": { "startDate": "2024-01-01", "endDate": "2024-03-31" },
  "value": { "discountPercent": 15 }
}
```

### 7. Audit Engine

- For each billing record:
  1. Find active contract(s) for client
  2. Apply rules in priority order
  3. Calculate expected amount
  4. Compare with actual amount
  5. Generate audit result with issue type
- Batch audit for all records

### 8. Audit Results

- Results table with filtering
- Drill-down view showing:
  - Contract rules applied
  - Expected calculation breakdown
  - Actual charge
  - Exact discrepancy
- Export results

### 9. Insights Engine

- Calculate total loss from expired discounts
- Top N clients percentage calculation
- Issue type distribution
- Time-based trends

---

## Acceptance Criteria

### Authentication
- [ ] User can register/login with email and password
- [ ] Sessions persist across page refreshes
- [ ] Protected routes redirect to login

### Dashboard
- [ ] Shows total revenue leakage in ZAR
- [ ] Breakdown shows underbilling, overbilling, missed
- [ ] Top clients table with sorting
- [ ] Recent results table
- [ ] Insights panel shows actionable insights

### Clients
- [ ] Can add new client with name and industry
- [ ] Can edit client details
- [ ] Can delete client (cascades to related data)
- [ ] List shows with search and filter

### Contracts
- [ ] Can create contract linked to client
- [ ] Can add rules of each type (tiered, flat, minimum, discount)
- [ ] Rules validate JSON syntax
- [ ] Can activate/deactivate rules

### Billing
- [ ] Can upload CSV file
- [ ] CSV parsed and records created
- [ ] Can manually add billing record
- [ ] Records link to client

### Audit
- [ ] Run audit calculates expected vs actual
- [ ] Results show expected amount, actual, difference
- [ ] Issue type correctly identified
- [ ] Drill-down shows calculation details

### UI/UX
- [ ] Dark mode applied by default
- [ ] Tables are sortable and filterable
- [ ] Responsive design works on mobile
- [ ] Loading states shown during operations
- [ ] Error states displayed clearly

### Edge Cases
- [ ] Handles missing/null values gracefully
- [ ] Handles overlapping rules (uses priority)
- [ ] Validates CSV format
- [ ] Rejects negative values
- [ ] Handles empty datasets