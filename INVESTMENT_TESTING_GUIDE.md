# Investment System Testing Guide

## 🎯 Overview
This guide will help you test the complete investment system flow with dummy data.

**What We'll Test:**
- ✅ Investment Plans (3 tiers)
- ✅ Creating Investments
- ✅ Daily Interest Calculation (Cron Job - Every 2 minutes)
- ✅ Profit Withdrawal (Anytime)
- ✅ Principal Withdrawal (Only on 28th)
- ✅ Investment Summary & Statistics
- ✅ Withdrawal Management

---

## 📋 Prerequisites

1. **Server must be running**
   ```bash
   cd cripto_exchange
   npm start
   ```

2. **Cron job should be set to 2 minutes** (Already configured)
   - File: `src/config/cronJobs.js`
   - Schedule: `*/2 * * * *` (every 2 minutes)

---

## 🚀 Step-by-Step Testing Process

### STEP 1: Seed Test Data
This will create 3 test users with investments and balances.

```bash
cd cripto_exchange
node seed-investment-test-data.js
```

**What this creates:**
- 3 Test Users (Investor 1, 2, 3)
- All use password: `Test@123`
- 3 Investment Plans (Basic 7%, Standard 8%, Premium 9%)
- 6 Active Investments across all users
- Initial profit balances for testing

**Expected Output:**
```
✅ Created 3 test users
✅ Created/Updated 3 investment plans
✅ Created 6 active investments
✅ Added initial profit balances

📊 INVESTMENT TEST DATA SUMMARY
══════════════════════════════════

👤 Test Investor 1 (investor1@test.com)
   Main Balance: $50,000
   Investment Balance: $2,000
   Profit Balance: $150
   Active Investments: 2
   └─ Investment 1: $5,000 @ 7% monthly
      Daily Interest: $11.67
   └─ Investment 2: $8,000 @ 7% monthly
      Daily Interest: $18.67
```

---

### STEP 2: Run Automated API Tests
This script tests all investment APIs automatically.

```bash
node test-investment-flow.js
```

**What this tests:**
1. ✅ Login all users
2. ✅ Get investment plans
3. ✅ View user balances
4. ✅ Get investment summary
5. ✅ Get all investments (detailed)
6. ✅ Create new investment
7. ✅ Test profit withdrawal
8. ✅ Test principal withdrawal (will fail if not 28th - expected)
9. ✅ Get all withdrawals
10. ✅ Get withdrawal statistics
11. ✅ Verify cron job effect

**Expected Output:**
- Detailed output for each test step
- ✅ Green checkmarks for successful operations
- ❌ Red marks for expected failures (principal withdrawal on non-28th)

---

### STEP 3: Verify Cron Job (Every 2 Minutes)
The cron job runs every 2 minutes and credits daily interest.

**Method 1: Watch Server Logs**
```
[Cron Job] Running daily interest calculation at 2026-03-11T10:30:00.000Z
[Cron Job] Processing daily interest for 6 investments
[Cron Job] Completed: 6 successful, 0 failed
```

**Method 2: Check Profit Balance Before/After**
```bash
# Check profit balance
node test-investment-flow.js

# Wait 2 minutes...

# Check again - profit should increase!
node test-investment-flow.js
```

**Example:**
- **Before:** Investor 1 Profit = $150.00
- **After 2 min:** Investor 1 Profit = $180.33 (increased by $30.33 daily interest)

---

### STEP 4: Manual API Testing with Postman/Thunder Client

#### 4.1 Login
```http
POST http://localhost:5000/api/users/login
Content-Type: application/json

{
  "email": "investor1@test.com",
  "password": "Test@123"
}
```

**Copy the token from response!**

---

#### 4.2 Get Investment Plans
```http
GET http://localhost:5000/api/investments/plans
Authorization: Bearer YOUR_TOKEN_HERE
```

---

#### 4.3 Get Investment Summary
```http
GET http://localhost:5000/api/investments/summary
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalInvested": 13000,
    "totalRemainingPrincipal": 13000,
    "activeInvestments": 2,
    "profitBalance": "150.00",
    "investments": [...]
  }
}
```

---

#### 4.4 Get All Investments
```http
GET http://localhost:5000/api/investments
Authorization: Bearer YOUR_TOKEN_HERE
```

---

#### 4.5 Create New Investment
```http
POST http://localhost:5000/api/investments
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "plan_id": "PLAN_ID_FROM_STEP_4.2",
  "amount": 2000
}
```

**Validations:**
- ✅ Amount must be within plan limits
- ✅ User must have sufficient investment_balance
- ✅ Interest rate auto-calculated based on tier

---

#### 4.6 Withdraw Profit (Allowed Anytime)
```http
POST http://localhost:5000/api/investments/withdraw-profit
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "amount": 100
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Profit withdrawal request submitted successfully",
  "data": {
    "type": "PROFIT",
    "requested_amount": "100.00",
    "status": "PENDING"
  }
}
```

---

#### 4.7 Withdraw Principal (Only on 28th)
```http
POST http://localhost:5000/api/investments/withdraw-principal
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "amount": 5000
}
```

**If today is NOT 28th:**
```json
{
  "success": false,
  "message": "Principal withdrawal is only allowed on the 28th of each month"
}
```

**If today IS 28th:**
```json
{
  "success": true,
  "message": "Principal withdrawal request submitted successfully",
  "data": {
    "withdrawal": {
      "type": "PRINCIPAL",
      "requested_amount": "5000.00",
      "status": "PENDING"
    },
    "affectedInvestments": [
      {
        "deducted": 5000,
        "newRemaining": 0
      }
    ]
  }
}
```

---

#### 4.8 Get All Withdrawals
```http
GET http://localhost:5000/api/withdrawals
Authorization: Bearer YOUR_TOKEN_HERE
```

**Filter by type:**
```http
GET http://localhost:5000/api/withdrawals?type=PROFIT
GET http://localhost:5000/api/withdrawals?type=PRINCIPAL
```

**Filter by status:**
```http
GET http://localhost:5000/api/withdrawals?status=PENDING
GET http://localhost:5000/api/withdrawals?status=COMPLETED
```

---

#### 4.9 Get Withdrawal Statistics
```http
GET http://localhost:5000/api/withdrawals/stats
Authorization: Bearer YOUR_TOKEN_HERE
```

---

#### 4.10 Get User Profile (Check Balances)
```http
GET http://localhost:5000/api/users/profile
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 📊 Expected Daily Interest Calculations

### Investor 1 (Basic Tier - 7%)
- Investment 1: $5,000 @ 7% = $11.67/day
- Investment 2: $8,000 @ 7% = $18.67/day
- **Total Daily Interest: $30.33**

### Investor 2 (Standard Tier - 8%)
- Investment 1: $15,000 @ 8% = $40.00/day
- Investment 2: $20,000 @ 8% = $53.33/day
- **Total Daily Interest: $93.33**

### Investor 3 (Premium Tier - 9%)
- Investment 1: $30,000 @ 9% = $90.00/day
- Investment 2: $28,000 @ 9% = $84.00/day
- **Total Daily Interest: $174.00**

**Formula:** 
```
daily_interest = remaining_principal × (monthly_rate / 30 / 100)
```

---

## 🧪 Advanced Testing Scenarios

### Scenario 1: Test Cron Job Multiple Times
```bash
# Check initial balance
node test-investment-flow.js

# Wait 2 minutes
# Check again - profit +1 day interest

# Wait another 2 minutes
# Check again - profit +2 days interest
```

### Scenario 2: Test Partial Principal Withdrawal (on 28th)
1. Note total remaining principal (e.g., $13,000)
2. Withdraw less than total (e.g., $5,000)
3. Verify FIFO deduction (oldest investment first)
4. Verify new remaining_principal updated
5. Verify daily interest recalculated on new principal

### Scenario 3: Test Multiple Profit Withdrawals
1. Accumulate profit (wait for cron)
2. Withdraw 50% of profit
3. Wait for more interest accumulation
4. Withdraw remaining profit
5. Verify all withdrawal records

### Scenario 4: Test Investment Creation with Different Tiers
- Create investment with $5,000 → 7% rate
- Create investment with $15,000 → 8% rate
- Create investment with $30,000 → 9% rate

---

## 📝 Verification Checklist

- [ ] All 3 users can login
- [ ] Investment plans are visible (3 plans)
- [ ] User balances are correct
- [ ] Investments are created and active
- [ ] Cron job runs every 2 minutes
- [ ] Profit balance increases after each cron run
- [ ] Daily interest calculation is accurate
- [ ] Profit withdrawal works (anytime)
- [ ] Principal withdrawal blocked (non-28th)
- [ ] Principal withdrawal works (on 28th)
- [ ] FIFO deduction works correctly
- [ ] Withdrawal history is tracked
- [ ] User can view all withdrawals
- [ ] Statistics are calculated correctly

---

## 🔧 Troubleshooting

### Cron Job Not Running
**Check server logs:**
```
Should see: [Cron Job] Running daily interest calculation...
```

**Verify cron schedule:**
```javascript
// src/config/cronJobs.js
cron.schedule('*/2 * * * *', async () => { ... });
```

### Profit Balance Not Increasing
1. Check if investments are ACTIVE
2. Check remaining_principal > 0
3. Check server logs for cron errors
4. Verify database transactions table

### API Returning 401 Unauthorized
- Token expired (login again)
- Token not included in header
- User not verified (check isVerified in DB)

### Insufficient Balance Errors
- Check investment_balance (not main_balance)
- For profit withdrawal: check profit_balance
- For principal: check total remaining_principal

---

## 🎯 Success Criteria

✅ **Investment System is Working if:**
1. Users can create investments
2. Cron job runs and credits interest every 2 minutes
3. Profit balance increases correctly
4. Profit withdrawals work anytime
5. Principal withdrawals only work on 28th
6. FIFO deduction logic is correct
7. All balances are tracked accurately
8. Withdrawal history is maintained

---

## 📞 Quick Reference

### Test User Credentials
```
Email: investor1@test.com | Password: Test@123
Email: investor2@test.com | Password: Test@123
Email: investor3@test.com | Password: Test@123
```

### Key Scripts
```bash
# Seed data
node seed-investment-test-data.js

# Run all tests
node test-investment-flow.js
```

### Important Endpoints
```
POST   /api/users/login
GET    /api/investments/plans
GET    /api/investments/summary
GET    /api/investments
POST   /api/investments
POST   /api/investments/withdraw-profit
POST   /api/investments/withdraw-principal
GET    /api/withdrawals
GET    /api/withdrawals/stats
```

---

## 🎓 Understanding the Flow

```
1. USER CREATES INVESTMENT
   ├─ Deducts from investment_balance
   ├─ Creates investment record
   └─ Sets initial remaining_principal

2. CRON JOB RUNS (Every 2 min)
   ├─ Calculates daily interest
   ├─ Credits to profit_balance
   ├─ Creates transaction record
   └─ Updates total_profit

3. USER WITHDRAWS PROFIT
   ├─ Anytime allowed
   ├─ Deducts from profit_balance
   ├─ Creates withdrawal request (PENDING)
   └─ Admin processes later

4. USER WITHDRAWS PRINCIPAL (28th only)
   ├─ Only on 28th of month
   ├─ Deducts using FIFO
   ├─ Updates remaining_principal
   ├─ Creates withdrawal request (PENDING)
   ├─ Processed between 1st-5th next month
   └─ Interest continues on new principal
```

---

**Happy Testing! 🚀**
