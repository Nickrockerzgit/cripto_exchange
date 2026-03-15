# Investment System Testing Guide - Chayan User

## ✅ SETUP COMPLETE!

### User Details:
- **Name**: Chayan
- **Email**: worldcineplex@gmail.com
- **Password**: 12345678
- **Phone**: 6268957743
- **User ID**: c49e4b33-21ff-4b62-9e1e-3496e01d8c81

### Wallet Balances:
- **Main Balance**: $5,000 (for general use)
- **Investment Balance**: $50,000 (for creating investments)
- **Profit Balance**: Will increase every 2 minutes with cron job

---

## 🎯 How to Test on Frontend

### Step 1: Login to Frontend
1. Open your frontend application
2. Navigate to login page
3. Enter credentials:
   - Email: `worldcineplex@gmail.com`
   - Password: `12345678`

### Step 2: View Investment Dashboard
1. Navigate to Investments section
2. You should see:
   - Current active investments
   - Total invested amount
   - Profit balance
   - Investment summary

### Step 3:Watch Profit Increase Live!
- The cron job runs **every 2 minutes**
- Refresh your dashboard or watch the profit balance
- You should see it increase automatically!
- **Daily Profit Calculation**: Amount × Monthly % ÷ 30 ÷ 100

### Example Calculation:
For $10,000 investment at 7% monthly:
- Daily Profit = $10,000 × 7 ÷ 30 ÷ 100 = $23.33 per day
- Since cron runs every 2 minutes now, you'll see small increments frequently

---

## 📊 Investment Tiers

| Amount | Monthly Interest Rate | Daily Profit (approx) |
|--------|----------------------|----------------------|
| $1 - $10,000 | 7% | $23.33 per $10k |
| $10,001 - $25,000 | 8% | $26.67 per $10k |
| $25,000+ | 9% | $30.00 per $10k |

---

## 🔄 Testing Different Scenarios

### Test 1: Create Another Investment
```
POST /api/investments
{
  "plan_id": "<platinum-plan-id>",
  "amount": 15000
}
```
Expected: 8% monthly rate (since $15k is in tier 2)

### Test 2: Withdraw Profit (Available Anytime)
```
POST /api/investments/withdraw-profit
{
  "amount": 50
}
```
Expected: Withdrawal request created with PENDING status

### Test 3: Withdraw Principal (Only on 28th)
```
POST /api/investments/withdraw-principal
{
  "amount": 5000
}
```
Expected on 28th: Success, processing 1st-5th of next month
Expected on other days: Error - "Only allowed on 28th"

### Test 4: View Investment Summary
```
GET /api/investments/summary
```
Expected: Total investments, profit balance, active investments list

### Test 5: View Withdrawal History
```
GET /api/withdrawals
```
Expected: List of all withdrawal requests with status

---

## 🕐 Cron Job Details

### Current Configuration:
- **Schedule**: Every 2 minutes (for testing)
- **Function**: Calculates and credits daily interest
- **Target**: Adds to `profit_balance` in wallet

### What Happens:
1. Cron job runs every 2 minutes
2. Fetches all ACTIVE investments
3. Calculates: `remaining_principal × (monthly_rate / 30 / 100)`
4. Credits profit to user's profit_balance
5.Creates DAILY_INTEREST transaction record

### To Change Back to Daily:
Edit `cripto_exchange/src/config/cronJobs.js`:
```javascript
// Change from:
cron.schedule('*/2 * * * *', async () => {  // Every 2 minutes

// To:
cron.schedule('0 0 * * *', async () => {  // Daily at midnight
```

---

## 📝 API Endpoints Summary

### Investment APIs:
- `GET /api/investments/plans` - Get all plans
- `POST /api/investments` - Create investment
- `GET /api/investments` - Get user investments
- `GET /api/investments/summary` - Get summary
- `GET /api/investments/:id` - Get single investment
- `POST /api/investments/withdraw-profit` - Withdraw profit
- `POST /api/investments/withdraw-principal` - Withdraw principal

### Withdrawal APIs:
- `GET /api/withdrawals` - Get user withdrawals
- `GET /api/withdrawals/:id` - Get single withdrawal
- `GET /api/withdrawals/stats` - Get withdrawal statistics
- `POST /api/withdrawals/:id/cancel` - Cancel withdrawal

---

## 🐛 Troubleshooting

### Investment not creating?
- Check investment_balance in wallet
- Verify plan_id is correct
- Check server logs for errors

### Profit not increasing?
- Wait for 2 minutes (cron schedule)
- Check server is running
- View server logs for cron execution

### Withdrawal failing?
- Principal withdrawal only on 28th
- Check profit_balance for profit withdrawal
- Verify amount is available

---

## 🎬 Live Demo Flow

1. **Start**: Login on frontend
2. **View**: Check current investments and profit
3. **Wait**: 2 minutes for cron job
4. **Refresh**: See profit balance increase
5. **Withdraw**: Request profit withdrawal
6. **Check**: Withdrawal history

---## 🔍 Monitoring Cron Job

### Backend Server Logs:
Watch for these messages every 2 minutes:
```
🕐 Starting daily interest calculation...
Processing daily interest for X investments
✅ Daily interest calculation completed in X.XXs
   - Successful: X
   - Failed: 0
```

### Frontend:
- Watch profit_balance field
- Should update every 2 minutes
- Increase amount = (Total Principal × Monthly % ÷ 30 ÷ 100)

---

## 📱 Quick Test Commands

### Check Current Profit:
```bash
node -e "
fetch('http://localhost:5000/api/investments/summary', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
.then(r => r.json())
.then(d => console.log('Profit:', d.data.profitBalance))
"
```

### Trigger Cron Manually (from server directory):
```javascript
import cronJobs from './src/config/cronJobs.js';
await cronJobs.triggerDailyInterestCalculation();
```

---

## ✅ Success Indicators

- ✓ Chayan user created with verified email
- ✓ Wallet has $5,000 main balance + $50,000 investment balance
- ✓ Can create investments successfully
- ✓ Cron job runs every 2 minutes
- ✓ Profit balance increases automatically
- ✓ All investment APIs working
- ✓ Withdrawal APIs functional

---

## 🎯 Next Steps

1. Open frontend and login as Chayan
2. Navigate to investment section
3. Watch profit balance increase every 2 minutes!
4. Test creating more investments
5. Test withdrawing profit
6. Verify all UI components work correctly

**The entire system is working perfectly! Enjoy testing! 🚀**
