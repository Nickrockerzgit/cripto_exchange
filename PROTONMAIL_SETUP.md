# ProtonMail SMTP Setup Guide

## ✅ Successfully Implemented ProtonMail for OTP Emails

ProtonMail SMTP has been configured in your email service to fix production email delivery issues.

## 📋 Setup Steps

### 1. Create ProtonMail Account
- Go to [ProtonMail](https://proton.me/mail)
- Create a free or paid account
- Verify your account

### 2. Configure ProtonMail Bridge (Required for SMTP Access)

**For ProtonMail Plus/Unlimited/Visionary accounts:**
- Download and install [ProtonMail Bridge](https://proton.me/mail/bridge)
- Login to ProtonMail Bridge with your account
- Bridge will provide SMTP credentials

**For Free ProtonMail accounts:**
ProtonMail free accounts don't support SMTP access via Bridge. You have two options:
- Upgrade to ProtonMail Plus (recommended for production)
- Use alternative service like:
  - **Brevo (Sendinblue)** - 300 emails/day free
  - **Mailgun** - Good for transactional emails
  - **SendGrid** - Reliable for OTP emails

### 3. Update .env File

Open your `.env` file and update these values:

```env
# Email Configuration - ProtonMail SMTP
EMAIL_HOST=smtp.protonmail.ch
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-protonmail@proton.me
EMAIL_PASS=your-protonmail-password-from-bridge
EMAIL_FROM=your-protonmail@proton.me
```

**Important Notes:**
- `EMAIL_HOST`: Use `smtp.protonmail.ch` (primary) or `127.0.0.1:1025` (if using Bridge locally)
- `EMAIL_PORT`: Use `587` for STARTTLS or `465` for SSL/TLS
- `EMAIL_SECURE`: Set to `false` for port 587, `true` for port 465
- `EMAIL_USER`: Your ProtonMail email address
- `EMAIL_PASS`: Bridge password (NOT your ProtonMail login password)
- `EMAIL_FROM`: Same as EMAIL_USER

### 4. Using ProtonMail Bridge Locally

If you're running ProtonMail Bridge on your local machine:

```env
EMAIL_HOST=127.0.0.1
EMAIL_PORT=1025
EMAIL_SECURE=false
EMAIL_USER=your-protonmail@proton.me
EMAIL_PASS=bridge-generated-password
EMAIL_FROM=your-protonmail@proton.me
```

### 5. For Production Deployment

For production servers:
1. Install ProtonMail Bridge on your production server
2. Configure Bridge with your ProtonMail account
3. Use the local Bridge SMTP settings (127.0.0.1:1025)

OR use ProtonMail's direct SMTP (requires paid plan):
```env
EMAIL_HOST=smtp.protonmail.ch
EMAIL_PORT=587
```

## 🔄 Alternative: Using Brevo (Sendinblue) - Recommended for Free Tier

If you need a free alternative with 300 emails/day:

### Brevo Setup:
1. Sign up at [Brevo](https://www.brevo.com/)
2. Go to Settings → SMTP & API
3. Generate SMTP credentials

```env
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-brevo-login
EMAIL_PASS=your-brevo-smtp-key
EMAIL_FROM=your-verified-email@domain.com
```

## 🔄 Alternative: Using Mailgun

### Mailgun Setup:
1. Sign up at [Mailgun](https://www.mailgun.com/)
2. Verify your domain
3. Get SMTP credentials from Sending → Domain Settings

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASS=your-mailgun-password
EMAIL_FROM=noreply@your-domain.com
```

## 🧪 Testing Email Configuration

After updating your `.env` file, restart your server:

```bash
cd cripto_exchange
npm run dev
```

The server will automatically verify the email connection on startup. Look for:
- ✅ "Email Service is ready to send messages" - SUCCESS
- ❌ "Email Service Error" - Configuration issue, check credentials

Test OTP email by:
1. Register a new user
2. Check if OTP email is received
3. Monitor server console for email logs

## 📊 Files Modified

- ✅ `.env` - Updated with ProtonMail SMTP configuration
- ✅ `src/config/emailConfig.js` - Enhanced with connection verification and better error handling
- ✅ `src/services/emailService.js` - Improved logging and error reporting

## 🐛 Troubleshooting

### Error: "Invalid login"
- Verify you're using Bridge password, not your ProtonMail login password
- Check EMAIL_USER matches your ProtonMail address exactly

### Error: "Connection timeout"
- Check if port 587 or 465 is blocked by firewall
- Try alternative port
- Ensure ProtonMail Bridge is running (if using Bridge)

### Error: "Self signed certificate"
- This is handled automatically with `rejectUnauthorized: false`
- If still issues, set `EMAIL_SECURE=false`

### Emails not sending in production
- Ensure your production server can access ProtonMail SMTP
- Check firewall rules allow outbound SMTP connections
- Verify ProtonMail Bridge is installed and running on production server
- Consider using Brevo or Mailgun for production (easier setup)

## 📝 Next Steps

1. Choose your email provider (ProtonMail Plus, Brevo, or Mailgun)
2. Get SMTP credentials
3. Update `.env` file with correct credentials
4. Restart your server
5. Test OTP email functionality
6. Monitor logs for any issues

## 🎯 Recommendation

For production use, I recommend:
- **Brevo (Sendinblue)** - Free tier with 300 emails/day, perfect for OTP
- **Mailgun** - If you need more volume
- **ProtonMail Plus** - If privacy is your top priority

All services are more reliable than Gmail for transactional emails and won't block your emails in production.
