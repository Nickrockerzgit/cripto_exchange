# 🎁 Referral System Documentation

## Overview

The Referral System allows users to invite friends and earn rewards based on referral count and rank progression. When a referred user successfully registers and makes their first investment, the referral becomes active and the referrer earns bonuses.

---

## 📋 Table of Contents

1. [Features](#features)
2. [How It Works](#how-it-works)
3. [API Endpoints](#api-endpoints)
4. [Database Schema](#database-schema)
5. [Referral Flow](#referral-flow)
6. [Rank System](#rank-system)
7. [Reward Structure](#reward-structure)
8. [Implementation Details](#implementation-details)
9. [Frontend Integration](#frontend-integration)

---

## ✨ Features

- ✅ **Unique Referral Codes**: Each user gets a unique referral code on registration
- ✅ **Referral Link Generation**: Automatic referral link creation
- ✅ **Referral Tracking**: Complete tracking of referred users
- ✅ **Activation System**: Referrals activate when referred user makes first investment
- ✅ **Rank Progression**: Multi-level rank system with increasing rewards
- ✅ **Automatic Rewards**: Bonuses automatically credited on rank upgrade
- ✅ **History Tracking**: Complete referral and reward history
- ✅ **Real-time Updates**: Live progress tracking and statistics

---

## 🔄 How It Works

### 1. User Registration with Referral

```javascript
// Registration URL format
https://your-domain.com/register?ref=REFERRAL_CODE

// Example
https://your-domain.com/register?ref=abc123xyz
```

### 2. Referral Entry Creation

When a new user registers with a referral code:
- System validates the referral code
- Creates a referral entry linking referrer and referred user
- Increments referrer's referral count
- Sets initial status as `PENDING`

### 3. Referral Activation

Referral activates automatically when:
- Referred user makes their **first investment**
- Status changes from `PENDING` to `ACTIVE`
- Referrer becomes eligible for rank rewards

### 4. Rank Progression & Rewards

- System checks referral count against rank requirements
- Auto-upgrades to next rank when threshold met
- Credits rank reward to referral balance
- Records reward in history (prevents duplicate rewards)

---

## 🔌 API Endpoints

### Get User Referrals

```http
GET /api/referrals/:userId
```

**Description**: Retrieve all referral data for a specific user

**Response**:
```json
{
  "totalReferred": 5,
  "totalBonus": 150.00,
  "rank": "Level 2",
  "nextRankTarget": 10,
  "referralLink": "https://domain.com/register?ref=abc123xyz",
  "referrals": [
    {
      "id": "ref-id-1",
      "name": "John Doe",
      "email": "john@example.com",
      "joinedDate": "2026-03-01T10:00:00Z",
      "status": "active",
      "bonus": 0
    }
  ]
}
```

**Status Codes**:
- `200` - Success
- `400` - Invalid user ID
- `404` - User not found
- `500` - Server error

---

## 🗄️ Database Schema

### Referral Table

```prisma
model Referral {
  id                String   @id @default(uuid())
  referrer_id       String
  referred_user_id  String   @unique
  activation_status Boolean  @default(false)
  bonus_credited    Boolean  @default(false)
  created_at        DateTime @default(now())

  referrer User @relation("ReferrerRelation", fields: [referrer_id], references: [id])
  referred User @relation("ReferredRelation", fields: [referred_user_id], references: [id])
}
```

### ReferralRank Table

```prisma
model ReferralRank {
  id                 String @id @default(uuid())
  rank_name          String @unique
  required_referrals Int
  reward_amount      Decimal
  referralUsers      User[]
  rankHistory        ReferralRankHistory[]
}
```

### ReferralRankHistory Table

```prisma
model ReferralRankHistory {
  id          String   @id @default(uuid())
  user_id     String
  rank_id     String
  reward_paid Decimal
  assigned_at DateTime @default(now())

  user User         @relation(fields: [user_id], references: [id])
  rank ReferralRank @relation(fields: [rank_id], references: [id])

  @@unique([user_id, rank_id])
}
```

### User Table (Referral Fields)

```prisma
model User {
  id                String   @id @default(uuid())
  referral_code     String?  @unique
  referral_count    Int      @default(0)
  referral_rank_id  String?
  
  referralRank         ReferralRank?         @relation(fields: [referral_rank_id], references: [id])
  referralsGiven       Referral[]            @relation("ReferrerRelation")
  referralReceived     Referral[]            @relation("ReferredRelation")
  referralRankHistory  ReferralRankHistory[]
}
```

---

## 🔀 Referral Flow

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION                         │
│  New user registers with referral code in URL parameter     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              VALIDATE REFERRAL CODE                          │
│  • Check if code exists                                      │
│  • Verify not self-referral                                  │
│  • Find referrer user                                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              CREATE REFERRAL ENTRY                           │
│  • Link referrer_id → referred_user_id                       │
│  • Set activation_status = false                             │
│  • Set bonus_credited = false                                │
│  • Increment referrer's referral_count                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              CHECK RANK UPGRADE                              │
│  • Compare referral_count with rank requirements             │
│  • Upgrade to next rank if eligible                          │
│  • Credit rank reward if requirements met                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         REFERRED USER MAKES FIRST INVESTMENT                 │
│  Triggers from investment.service.js                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              ACTIVATE REFERRAL                               │
│  • Find referral entry for user                              │
│  • Set activation_status = true                              │
│  • Referral now counts as "active"                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            REWARD DISTRIBUTION (if applicable)               │
│  • Check if rank requirement newly met                       │
│  • Credit reward to referral_balance                         │
│  • Credit reward to main_balance                             │
│  • Record in ReferralRankHistory                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏆 Rank System

### Default Rank Levels

| Rank      | Required Referrals | Reward Amount | Status        |
|-----------|-------------------|---------------|---------------|
| Level 1   | 0                 | $0            | Default       |
| Level 2   | 5                 | $50           | Bronze        |
| Level 3   | 10                | $150          | Silver        |
| Level 4   | 25                | $500          | Gold          |
| Level 5   | 50                | $1,500        | Platinum      |
| Level 6   | 100               | $5,000        | Diamond       |

### Creating Rank Levels

```javascript
// Example: Creating ranks via Prisma seed
await prisma.referralRank.createMany({
  data: [
    { rank_name: 'Level 1', required_referrals: 0, reward_amount: 0 },
    { rank_name: 'Level 2', required_referrals: 5, reward_amount: 50 },
    { rank_name: 'Level 3', required_referrals: 10, reward_amount: 150 },
    { rank_name: 'Level 4', required_referrals: 25, reward_amount: 500 },
    { rank_name: 'Level 5', required_referrals: 50, reward_amount: 1500 },
    { rank_name: 'Level 6', required_referrals: 100, reward_amount: 5000 },
  ]
});
```

---

## 💰 Reward Structure

### Automatic Reward Distribution

1. **On Registration**: No immediate reward
2. **On Referral Activation**: Referral counted for rank progression
3. **On Rank Upgrade**: Automatic bonus credit

### Reward Calculation

```javascript
// Check if user completed rank requirement
if (user.referral_count >= currentRank.required_referrals) {
  // Check if reward already given for this rank
  const alreadyRewarded = await prisma.referralRankHistory.findUnique({
    where: {
      user_id_rank_id: { user_id: userId, rank_id: currentRank.id }
    }
  });

  if (!alreadyRewarded) {
    // Credit to wallet
    await prisma.wallet.update({
      where: { user_id: userId },
      data: {
        referral_balance: { increment: currentRank.reward_amount },
        main_balance: { increment: currentRank.reward_amount }
      }
    });

    // Record reward history
    await prisma.referralRankHistory.create({
      data: {
        user_id: userId,
        rank_id: currentRank.id,
        reward_paid: currentRank.reward_amount
      }
    });
  }
}
```

---

## 🛠️ Implementation Details

### Controllers

**File**: `src/controllers/refralsControllers.js`

#### handleReferralOnRegister

```javascript
async function handleReferralOnRegister(referralCode, newUserId) {
  if (!referralCode) return;
  
  // Find referrer
  const referrer = await prisma.user.findUnique({
    where: { referral_code: referralCode }
  });
  
  if (!referrer || referrer.id === newUserId) return;
  
  // Create referral entry
  await refralService.createReferral({
    referrer_id: referrer.id,
    referred_user_id: newUserId
  });
  
  // Update referral count
  await prisma.user.update({
    where: { id: referrer.id },
    data: { referral_count: { increment: 1 } }
  });
  
  // Check rank upgrade
  await checkAndUpgradeRank(referrer.id);
}
```

#### checkAndUpgradeRank

```javascript
async function checkAndUpgradeRank(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, referral_count: true, referral_rank_id: true }
  });
  
  const currentRank = await prisma.referralRank.findUnique({
    where: { id: user.referral_rank_id }
  });
  
  // Assign next level if eligible
  if (user.referral_count >= currentRank.required_referrals) {
    const nextRank = await prisma.referralRank.findFirst({
      where: { required_referrals: { gt: currentRank.required_referrals } },
      orderBy: { required_referrals: 'asc' }
    });
    
    if (nextRank) {
      await prisma.user.update({
        where: { id: userId },
        data: { referral_rank_id: nextRank.id }
      });
    }
  }
  
  // Reward logic (one-time per rank)
  if (user.referral_count >= currentRank.required_referrals) {
    // Check if already rewarded
    // Credit wallet if not
    // Record in history
  }
}
```

### Services

**File**: `src/services/referral.service.js`

#### getReferralsByUserId

```javascript
async function getReferralsByUserId(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallets: true,
      referralsGiven: {
        include: { referred: true },
        orderBy: { created_at: "desc" }
      }
    }
  });

  const totalReferred = user.referralsGiven.length;
  const totalBonus = Number(user.wallets[0]?.referral_balance || 0);
  
  const ranks = await prisma.referralRank.findUnique({
    where: { id: user.referral_rank_id }
  });
  const rank = ranks?.rank_name || "Level 1";

  const nextRank = await prisma.referralRank.findFirst({
    where: { required_referrals: { gt: totalReferred } },
    orderBy: { required_referrals: "asc" }
  });

  const nextRankTarget = nextRank?.required_referrals || null;
  const referralLink = `${process.env.FRONTEND_BASE_URI}/register?ref=${user.referral_code}`;

  return {
    totalReferred,
    totalBonus,
    rank,
    nextRankTarget,
    referralLink,
    referrals: user.referralsGiven.map((ref) => ({
      id: ref.id,
      name: ref.referred.name,
      email: ref.referred.email,
      joinedDate: ref.referred.created_at,
      status: ref.activation_status ? "active" : "pending",
      bonus: 0
    }))
  };
}
```

### Investment Service Integration

**File**: `src/services/investment.service.js`

```javascript
// Inside createInvestment transaction
// Activate referral if this is user's first investment
const referral = await tx.referral.findFirst({
  where: {
    referred_user_id: userId,
    activation_status: false
  }
});

if (referral) {
  await tx.referral.update({
    where: { id: referral.id },
    data: {
      activation_status: true,
      bonus_credited: false
    }
  });
  
  console.log(`Referral activated for user ${userId}`);
}
```

---

## 🎨 Frontend Integration

### Referral Page Component

**File**: `frontend/client/pages/Referral.tsx`

```tsx
import { referralService } from "@/services/referral.service";
import { ReferralResponse } from "@/types/referral.types";

export default function Referral() {
  const { user } = useAuth();
  const [referralData, setReferralData] = useState<ReferralResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferralData = async () => {
      if (!user?.id) return;
      
      try {
        const data = await referralService.getReferralData(user.id);
        setReferralData(data);
      } catch (error) {
        console.error("Referral fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReferralData();
  }, [user?.id]);

  // UI rendering with referralData
}
```

### Referral Service

**File**: `frontend/client/services/referral.service.ts`

```typescript
import { apiClient } from "./api";
import { ReferralResponse } from "@/types/referral.types";

class ReferralService {
  async getReferralData(userId: string): Promise<ReferralResponse> {
    const response = await apiClient.get<ReferralResponse>(`/referrals/${userId}`);
    return response.data;
  }
}

export const referralService = new ReferralService();
```

### Type Definitions

**File**: `frontend/client/types/referral.types.tsx`

```typescript
type ReferralUser = {
  id: string;
  name: string;
  email: string;
  joinedDate: string;
  status: 'pending' | 'completed' | 'active';
  bonus: number;
}

type ReferralResponse = {
  totalReferred: number;
  totalBonus: number;
  rank: string;
  nextRankTarget: number;
  referralLink: string;
  referrals: ReferralUser[];
}

export type { ReferralResponse, ReferralUser };
```

---

## 🔧 Configuration

### Environment Variables

Add to `.env`:

```env
FRONTEND_BASE_URI=https://yourdomain.com
```

### Seed Initial Ranks

Run seed script to create initial rank structure:

```bash
node seed-referral-ranks.js
```

Example seed script:

```javascript
// seed-referral-ranks.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const ranks = [
    { rank_name: 'Level 1', required_referrals: 0, reward_amount: 0 },
    { rank_name: 'Level 2', required_referrals: 5, reward_amount: 50 },
    { rank_name: 'Level 3', required_referrals: 10, reward_amount: 150 },
    { rank_name: 'Level 4', required_referrals: 25, reward_amount: 500 },
    { rank_name: 'Level 5', required_referrals: 50, reward_amount: 1500 },
    { rank_name: 'Level 6', required_referrals: 100, reward_amount: 5000 },
  ];

  for (const rank of ranks) {
    await prisma.referralRank.upsert({
      where: { rank_name: rank.rank_name },
      update: rank,
      create: rank
    });
  }

  console.log('Referral ranks seeded successfully');
}

main();
```

---

## 📊 Usage Examples

### Example 1: User Shares Referral Link

```javascript
// User copies their referral link
const referralLink = "https://yourdomain.com/register?ref=abc123xyz";

// Friend clicks and registers
// Backend automatically:
// 1. Validates referral code
// 2. Creates referral entry
// 3. Increments referrer's count
// 4. Checks for rank upgrade
```

### Example 2: Referred User Activates

```javascript
// Referred user makes first investment
// Investment service automatically:
// 1. Finds pending referral
// 2. Sets activation_status = true
// 3. Referral now counts as "active"
```

### Example 3: Rank Progression

```javascript
// User reaches 5 referrals
// System automatically:
// 1. Upgrades from Level 1 to Level 2
// 2. Credits $50 reward to wallet
// 3. Records in ReferralRankHistory
// 4. Shows progress to Level 3 (10 referrals)
```

---

## 🐛 Troubleshooting

### Referral Not Creating

**Issue**: Referral entry not created on registration

**Solutions**:
- Verify referral code exists in database
- Check for self-referral prevention
- Ensure `handleReferralOnRegister` is called in registration flow
- Check console logs for errors

### Referral Not Activating

**Issue**: Referral stays in pending status

**Solutions**:
- Verify investment service includes activation logic
- Check if user has made first investment
- Ensure transaction completes successfully
- Verify `activation_status` field update

### Reward Not Credited

**Issue**: User reached rank but no reward

**Solutions**:
- Check if reward already credited (duplicate prevention)
- Verify wallet update transaction
- Check `ReferralRankHistory` for existing entry
- Ensure rank requirements match actual count

### Progress Not Updating

**Issue**: Frontend not showing latest data

**Solutions**:
- Check API endpoint response
- Verify user authentication
- Refresh referral data on page load
- Check network tab for API errors

---

## 📝 Best Practices

1. **Always validate referral codes** before creating entries
2. **Prevent self-referral** to avoid abuse
3. **Use transactions** for all referral operations
4. **Log important events** for debugging
5. **Check for duplicate rewards** before crediting
6. **Update referral count atomically** to avoid race conditions
7. **Handle edge cases** like missing ranks or users
8. **Provide clear error messages** to users
9. **Test rank progression** with different scenarios
10. **Monitor referral activation rate** for system health

---

## 🔐 Security Considerations

- ✅ Validate referral codes server-side only
- ✅ Prevent creation of fake referral entries
- ✅ Rate-limit referral API endpoints
- ✅ Check for duplicate user emails/phones
- ✅ Verify user ownership before showing referral data
- ✅ Use unique indexes on referral codes
- ✅ Implement fraud detection for suspicious patterns
- ✅ Log all referral activities for audit

---

## 📈 Analytics & Monitoring

### Key Metrics to Track

1. **Total Referrals**: Overall referral count
2. **Activation Rate**: Percentage of activated referrals
3. **Top Referrers**: Users with most referrals
4. **Rank Distribution**: Users per rank level
5. **Reward Payouts**: Total rewards distributed
6. **Average Time to Activation**: Days from signup to first investment
7. **Referral Source**: Which channels drive most referrals

### Example Query: Top Referrers

```javascript
const topReferrers = await prisma.user.findMany({
  where: { referral_count: { gt: 0 } },
  orderBy: { referral_count: 'desc' },
  take: 10,
  include: {
    wallets: true,
    referralRank: true
  }
});
```

---

## 🚀 Future Enhancements

- [ ] Multi-tier referral system (sub-referrals)
- [ ] Time-limited bonus campaigns
- [ ] Referral leaderboard
- [ ] Custom referral codes
- [ ] Social media integration
- [ ] Email notifications for rank upgrades
- [ ] Referral analytics dashboard
- [ ] Export referral reports
- [ ] Bonus for top performers
- [ ] Seasonal referral contests

---

## 📞 Support

For issues or questions regarding the referral system:

- Check this documentation
- Review console logs
- Check database entries
- Verify environment configuration
- Test with sample data

---

**Last Updated**: March 4, 2026  
**Version**: 1.0.0  
**Author**: Development Team
