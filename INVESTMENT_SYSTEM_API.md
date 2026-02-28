# Investment & Withdrawal System API Documentation

## Overview
This system implements a complete investment and withdrawal management system with:
- Tier-based simple interest calculation
- Daily interest credit via cron job
- Profit withdrawal (anytime)
- Principal withdrawal (28th of month only, with FIFO processing)

---

## 📋 Prerequisites

### Install Required Dependencies
```bash
npm install node-cron
```

### Run Prisma Migration
```bash
npx prisma migrate dev --name add_investment_withdrawal_system
```

---

## 🔧 Investment Interest Tiers

| Investment Amount | Monthly Interest Rate |
|-------------------|----------------------|
| $1 - $10,000      | 7%                   |
| $10,001 - $25,000 | 8%                   |
| $25,000+          | 9%                   |

**Interest Calculation:**
- Type: Simple Interest (Non-Compounding)
- Formula: `daily_interest = remaining_principal × (monthly_rate / 30 / 100)`
- Interest is credited to profit wallet daily at midnight (UTC)

---

## 📍 API Endpoints

### Investment Plans

#### Get All Investment Plans
```http
GET /api/investments/plans
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Investment plans retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Basic Plan",
      "min_amount": "1000.00",
      "max_amount": "10000.00",
      "min_interest": "7.00",
      "max_interest": "7.00"
    }
  ]
}
```

---

### Create Investment

#### Create New Investment
```http
POST /api/investments
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan_id": "uuid",
  "amount": 5000
}
```

**Validations:**
- User must have sufficient investment_balance
- Amount must be within plan limits
- Interest rate is automatically calculated based on tier

**Response:**
```json
{
  "success": true,
  "message": "Investment created successfully",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "plan_id": "uuid",
    "amount": "5000.00",
    "remaining_principal": "5000.00",
    "monthly_interest_rate": "7.00",
    "start_date": "2026-02-26T00:00:00.000Z",
    "status": "ACTIVE"
  }
}
```

---

### View Investments

#### Get All User Investments
```http
GET /api/investments
Authorization: Bearer <token>
Query Parameters: ?status=ACTIVE (optional)
```

#### Get Single Investment
```http
GET /api/investments/:id
Authorization: Bearer <token>
```

#### Get Investment Summary
```http
GET /api/investments/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Investment summary retrieved successfully",
  "data": {
    "totalInvested": 15000,
    "totalRemainingPrincipal": 12000,
    "activeInvestments": 3,
    "profitBalance": "450.00",
    "investments": [
      {
        "id": "uuid",
        "amount": "5000.00",
        "remainingPrincipal": "5000.00",
        "monthlyRate": "7.00",
        "startDate": "2026-02-20T00:00:00.000Z"
      }
    ]
  }
}
```

---

### Profit Withdrawal

#### Withdraw Profit (Allowed Anytime)
```http
POST /api/investments/withdraw-profit
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 200
}
```

**Rules:**
- Can be requested any day
- Does not affect principal amount
- Must have sufficient profit balance
- Creates withdrawal request with PENDING status

**Response:**
```json
{
  "success": true,
  "message": "Profit withdrawal request submitted successfully",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "type": "PROFIT",
    "requested_amount": "200.00",
    "net_amount": "200.00",
    "status": "PENDING",
    "ticket_raised_date": "2026-02-26T00:00:00.000Z"
  }
}
```

---

### Principal Withdrawal

#### Withdraw Principal (Only on 28th)
```http
POST /api/investments/withdraw-principal
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 3000
}
```

**Rules:**
- ✅ Only allowed on 28th of each month
- ✅ Processing occurs between 1st-5th of next month
- ✅ Partial withdrawal allowed
- ✅ FIFO deduction (oldest investment first)
- ✅ Only one request per month per user
- ✅ Interest continues on updated remaining_principal

**Response:**
```json
{
  "success": true,
  "message": "Principal withdrawal request submitted successfully. Processing will occur between 1st-5th of next month.",
  "data": {
    "withdrawal": {
      "id": "uuid",
      "user_id": "uuid",
      "type": "PRINCIPAL",
      "requested_amount": "3000.00",
      "status": "PENDING"
    },
    "affectedInvestments": [
      {
        "id": "investment1_uuid",
        "deducted": 2000,
        "newRemaining": 0
      },
      {
        "id": "investment2_uuid",
        "deducted": 1000,
        "newRemaining": 4000
      }
    ]
  }
}
```

**Error Cases:**
```json
// If not 28th
{
  "success": false,
  "message": "Principal withdrawal is only allowed on the 28th of each month"
}

// If already requested this month
{
  "success": false,
  "message": "You already have a principal withdrawal request for this month"
}

// If amount exceeds total principal
{
  "success": false,
  "message": "Withdrawal amount exceeds total remaining principal (12000)"
}
```

---

### View Withdrawals

#### Get All User Withdrawals
```http
GET /api/withdrawals
Authorization: Bearer <token>
Query Parameters: 
  ?type=PROFIT|PRINCIPAL (optional)
  ?status=PENDING|COMPLETED|CANCELLED (optional)
```

#### Get Single Withdrawal
```http
GET /api/withdrawals/:id
Authorization: Bearer <token>
```

#### Get Withdrawal Statistics
```http
GET /api/withdrawals/stats
Authorization: Bearer <token>
```

#### Cancel Pending Withdrawal
```http
POST /api/withdrawals/:id/cancel
Authorization: Bearer <token>
```

**Note:** Principal withdrawals cannot be cancelled after submission

---

## 🤖 Automated Processes

### Daily Interest Calculation Cron Job

**Schedule:** Runs daily at 00:00 UTC

**Process:**
1. Fetches all ACTIVE investments with remaining_principal > 0
2. Calculates daily interest: `remaining_principal × (monthly_rate / 30 / 100)`
3. Credits interest to user's profit_balance
4. Logs transaction with type: DAILY_INTEREST

**Manual Trigger (for testing):**
```javascript
import cronJobs from './src/config/cronJobs.js';
const results = await cronJobs.triggerDailyInterestCalculation();
```

### Principal Withdrawal Processing (Admin)

**Schedule:** Manual/automated between 1st-5th of month

```http
POST /api/withdrawals/process-principal
Authorization: Bearer <admin_token>
```

This endpoint:
1. Processes all PENDING principal withdrawals from previous month
2. Credits net_amount to user's main_balance
3. Updates withdrawal status to COMPLETED
4. Updates transaction records

---

## 💾 Database Schema Changes

### Investment Table
```prisma
model Investment {
  id                    String   @id @default(uuid())
  user_id               String
  plan_id               String
  amount                Decimal
  remaining_principal   Decimal  // 🆕 Added
  monthly_interest_rate Decimal
  start_date            DateTime
  status                String?  // ACTIVE / COMPLETED / CANCELLED
  created_at            DateTime @default(now())
}
```

### Withdrawal Table
```prisma
model Withdrawal {
  id                 String    @id @default(uuid())
  user_id            String
  type               String?   // PROFIT / PRINCIPAL
  requested_amount   Decimal
  platform_fee       Decimal?
  penalty_fee        Decimal?
  net_amount         Decimal?
  status             String?   // PENDING / PROCESSING / COMPLETED / REJECTED
  ticket_raised_date DateTime?
  processed_at       DateTime?
  created_at         DateTime  @default(now())
}
```

---

## 📊 Example Flow

### User Makes Investment
1. User transfers funds to investment_balance
2. User creates investment: POST /api/investments
3. Amount deducted from investment_balance
4. Investment record created with tier-based interest rate

### Daily Interest Accumulation
1. Cron job runs at midnight
2. Calculates interest for each active investment
3. Credits to profit_balance
4. Transaction logged

### Profit Withdrawal (Anytime)
1. User requests profit withdrawal: POST /api/investments/withdraw-profit
2. Amount deducted from profit_balance
3. Withdrawal status: PENDING
4. Admin processes withdrawal (out of scope)

### Principal Withdrawal (28th Only)
1. User requests on 28th: POST /api/investments/withdraw-principal
2. System deducts from investments (FIFO)
3. Updates remaining_principal for each investment
4. Withdrawal status: PENDING
5. Between 1st-5th: Admin runs process-principal endpoint
6. Amount credited to main_balance
7. Withdrawal status: COMPLETED

---

## 🔒 Security Considerations

1. **Authentication:** All endpoints require valid JWT token
2. **Authorization:** Users can only access their own data
3. **Date Validation:** Principal withdrawal strictly enforced on 28th
4. **Double Request Prevention:** One principal withdrawal per month
5. **Balance Checks:** Insufficient balance checks before processing
6. **FIFO Integrity:** Oldest investments deducted first
7. **Transaction Atomicity:** All operations use Prisma transactions

---

## 🧪 Testing Checklist

- [ ] Create investment with tier 1 amount (7%)
- [ ] Create investment with tier 2 amount (8%)
- [ ] Create investment with tier 3 amount (9%)
- [ ] Verify daily interest calculation
- [ ] Request profit withdrawal
- [ ] Try principal withdrawal on non-28th (should fail)
- [ ] Request principal withdrawal on 28th (should succeed)
- [ ] Try second principal request same month (should fail)
- [ ] Verify FIFO deduction logic
- [ ] Test partial principal withdrawal
- [ ] Process principal withdrawals (1st-5th)
- [ ] Verify interest continues on new remaining_principal

---

## 📝 Notes

1. **Timezone:** Cron job runs on UTC timezone. Adjust in `src/config/cronJobs.js` if needed
2. **28th Rule:** If month doesn't have 28th (e.g., February in non-leap year), handle edge case
3. **Admin Role:** process-principal endpoint should have admin middleware (TODO)
4. **Notifications:** Add email/SMS notifications for withdrawal status updates
5. **Interest History:** Consider adding a table to track daily interest credits for audit

---

## 🚀 Getting Started

1. Install dependencies:
```bash
npm install node-cron
```

2. Run migration:
```bash
npx prisma migrate dev
```

3. Start server:
```bash
npm start
```

4. The cron job will automatically start and run daily at midnight

---

## 📞 Support

For issues or questions, contact the development team.
