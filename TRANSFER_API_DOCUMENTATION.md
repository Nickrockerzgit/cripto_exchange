# User-to-User Wallet Transfer API Documentation

## Overview
This system allows users to transfer wallet balance directly to other users within the application. All transfers are internal ledger updates with no blockchain integration.

## Features
- ✅ Direct user-to-user wallet transfers
- ✅ Atomic database transactions (all-or-nothing)
- ✅ Transfer history tracking
- ✅ Search for receivers by email/phone
- ✅ Transfer statistics
- ✅ Insufficient balance protection
- ✅ Transaction logging for both parties

## Base URL
```
http://localhost:5000/api/transfers
```

## Authentication
All endpoints require JWT Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## API Endpoints

### 1. Execute Transfer
Transfer funds from your wallet to another user.

**Endpoint:** `POST /api/transfers`

**Request Body:**
```json
{
  "receiver": "user@example.com",  // Email, phone, or user ID
  "amount": 50.00,                  // Amount to transfer (must be > 0)
  "description": "Payment for lunch" // Optional description
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Transfer completed successfully",
  "data": {
    "transferId": "uuid",
    "amount": 50.00,
    "receiver": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "newBalance": 450.00,
    "timestamp": "2026-03-02T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid amount, insufficient balance, or trying to transfer to yourself
- `404` - Receiver not found
- `500` - Server error

---

### 2. Get Transfer History
Retrieve your transfer history with pagination.

**Endpoint:** `GET /api/transfers/history`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `type` (optional): Filter by type - 'sent', 'received', or 'all' (default: 'all')

**Example Request:**
```
GET /api/transfers/history?page=1&limit=10&type=all
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Transfer history fetched successfully",
  "data": {
    "data": [
      {
        "id": "uuid",
        "amount": 50.00,
        "status": "SUCCESS",
        "description": "Payment for lunch",
        "type": "SENT",
        "sender": {
          "id": "uuid",
          "name": "Your Name",
          "email": "you@example.com"
        },
        "receiver": {
          "id": "uuid",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "created_at": "2026-03-02T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
}
```

---

### 3. Get Transfer by ID
Get details of a specific transfer.

**Endpoint:** `GET /api/transfers/:id`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Transfer details fetched successfully",
  "data": {
    "id": "uuid",
    "amount": 50.00,
    "status": "SUCCESS",
    "description": "Payment for lunch",
    "type": "SENT",
    "sender": {
      "id": "uuid",
      "name": "Your Name",
      "email": "you@example.com"
    },
    "receiver": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "created_at": "2026-03-02T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Transfer ID required
- `403` - Unauthorized to view this transfer
- `404` - Transfer not found

---

### 4. Search Receiver
Find a user by email or phone number before transferring.

**Endpoint:** `POST /api/transfers/search-receiver`

**Request Body:**
```json
{
  "identifier": "john@example.com"  // Email or phone number
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User found",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

**Error Responses:**
- `400` - Email or phone number required
- `404` - User not found or inactive

---

### 5. Get Transfer Statistics
Get your transfer statistics summary.

**Endpoint:** `GET /api/transfers/stats`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Transfer statistics fetched successfully",
  "data": {
    "totalSent": 500.00,
    "totalReceived": 750.00,
    "totalSentCount": 10,
    "totalReceivedCount": 15,
    "netTransfer": 250.00
  }
}
```

---

## Transfer Flow Example

### Step 1: Search for Receiver (Optional)
```bash
curl -X POST http://localhost:5000/api/transfers/search-receiver \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "receiver@example.com"
  }'
```

### Step 2: Execute Transfer
```bash
curl -X POST http://localhost:5000/api/transfers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiver": "receiver@example.com",
    "amount": 100.00,
    "description": "Payment for service"
  }'
```

### Step 3: View Transfer History
```bash
curl -X GET "http://localhost:5000/api/transfers/history?page=1&limit=10&type=sent" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Transfer Rules & Validations

1. **Amount Validation:**
   - Must be greater than 0
   - Must be a valid number

2. **Balance Validation:**
   - Sender must have sufficient balance in main wallet
   - Transfer will fail if balance is insufficient

3. **User Validation:**
   - Receiver must exist in the system
   - Receiver account must be ACTIVE
   - Cannot transfer to yourself

4. **Transaction Safety:**
   - All transfers are atomic (database transaction)
   - If any step fails, no balance changes occur
   - Both sender and receiver transactions are logged

5. **Transfer Types:**
   - Sender transaction: `USER_TO_USER_TRANSFER_SENT`
   - Receiver transaction: `USER_TO_USER_TRANSFER_RECEIVED`

---

## Database Models

### InternalTransfer
```prisma
model InternalTransfer {
  id          String   @id @default(uuid())
  sender_id   String
  receiver_id String
  amount      Decimal
  status      String   @default("SUCCESS")
  description String?
  created_at  DateTime @default(now())
  
  sender   User @relation("SenderRelation", fields: [sender_id], references: [id])
  receiver User @relation("ReceiverRelation", fields: [receiver_id], references: [id])
}
```

### Transaction Logging
Every transfer creates TWO transaction records:
1. **Sender Transaction** - Debit from main wallet
2. **Receiver Transaction** - Credit to main wallet

---

## Error Handling

### Common Error Codes

| Status Code | Error Message | Cause |
|------------|---------------|-------|
| 400 | Valid amount is required | Amount is 0, negative, or invalid |
| 400 | Insufficient balance | Sender doesn't have enough balance |
| 400 | Cannot transfer to yourself | Sender = Receiver |
| 400 | Receiver account is not active | Receiver's account status ≠ ACTIVE |
| 404 | Receiver not found | Invalid receiver identifier |
| 404 | Transfer not found | Invalid transfer ID |
| 403 | Unauthorized to view this transfer | User is not sender or receiver |
| 401 | No token provided / Invalid token | Authentication failed |

---

## Testing Checklist

- [ ] Transfer with valid amount
- [ ] Transfer with insufficient balance
- [ ] Transfer to non-existent user
- [ ] Transfer to inactive user
- [ ] Transfer to self
- [ ] Transfer with 0 or negative amount
- [ ] View sent transfers
- [ ] View received transfers
- [ ] View all transfers
- [ ] Search for valid receiver
- [ ] Search for invalid receiver
- [ ] Get transfer statistics
- [ ] Verify atomic transaction (both wallets update or none)

---

## Notes

1. **Internal System Only:** This is NOT a blockchain transfer. All balances are internal ledger entries.

2. **No Fees:** Currently, no transaction fees are deducted. All transfers are 1:1.

3. **Main Wallet Only:** Transfers only affect the `main_balance` field in the wallet.

4. **Status Field:** Currently, all successful transfers have status "SUCCESS". Failed transfers don't create records (transaction rollback).

5. **No Reversal:** Manual reversals must be implemented separately if needed.

---

## Future Enhancements (Optional)

- [ ] Add transfer limits (daily/monthly)
- [ ] Add transaction fees
- [ ] Add transfer approval workflow
- [ ] Add transfer reversal feature
- [ ] Add webhook notifications
- [ ] Add real-time notifications (WebSocket)
- [ ] Add transfer scheduling
- [ ] Add bulk transfers
