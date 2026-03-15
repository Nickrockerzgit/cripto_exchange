# 🚀 AWS Deployment Checklist

## ❌ Current Issues
1. **CORS Error**: Frontend URL not in allowed origins
2. **Email Not Sending**: OTP emails not reaching users

---

## ✅ Step-by-Step Fix

### 1️⃣ **Fix CORS Configuration**

#### Get your AWS Frontend URL
When you deploy your frontend on AWS, you'll get a URL like:
- `http://your-app.elasticbeanstalk.com`
- `http://ec2-xx-xx-xx-xx.compute.amazonaws.com`
- Or custom domain: `https://yourdomain.com`

#### Add it to Environment Variables on AWS:

**On AWS EC2/Elastic Beanstalk:**
```bash
# Add environment variable
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080,https://fintech-gold-psi.vercel.app,YOUR_AWS_FRONTEND_URL_HERE
```

**Example:**
```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080,https://fintech-gold-psi.vercel.app,http://your-app.elasticbeanstalk.com,https://yourdomain.com
```

---

### 2️⃣ **Fix Email Configuration**

#### Required Environment Variables on AWS:

```bash
# Email Service (ProtonMail SMTP)
EMAIL_HOST=smtp.protonmail.ch
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-email-password
EMAIL_FROM=your-email@domain.com
```

⚠️ **IMPORTANT**: Make sure these variables are SET on your AWS deployment!

#### How to Set Environment Variables on AWS:

##### **Method A: AWS Elastic Beanstalk Console**
1. Go to Elastic Beanstalk Console
2. Select your application > Configuration
3. Under "Software" category, click "Edit"
4. Scroll to "Environment properties"
5. Add each variable listed above

##### **Method B: AWS EC2 (using PM2/Docker)**
Create `.env` file on server:
```bash
ssh into your EC2 instance
cd /path/to/your/app
nano .env
# Paste all environment variables
# Save and restart app
pm2 restart all
```

##### **Method C: Using AWS CLI**
```bash
eb setenv EMAIL_HOST=smtp.protonmail.ch EMAIL_PORT=587 EMAIL_USER=your-email@domain.com EMAIL_PASS=your-email-password
```

---

### 3️⃣ **Check Email Service Logs**

After deployment, check server logs for email service status:

```bash
# SSH into AWS instance
ssh -i your-key.pem ec2-user@your-instance

# Check logs
pm2 logs
# or
tail -f /var/log/your-app/error.log
```

**Look for these messages:**
- ✅ `Email Service is ready to send messages` → Good!
- ❌ `EMAIL SERVICE CONNECTION FAILED` → Check credentials
- ❌ `CORS Blocked: http://...` → Add that URL to ALLOWED_ORIGINS

---

### 4️⃣ **Complete Environment Variables Checklist**

Make sure ALL these are set on AWS:

#### **Required Variables:**
```bash
# Database
DATABASE_URL="your-production-database-url"

# Server
PORT=5000
NODE_ENV=production

# JWT
JWT_SECRET="your-secret-here"
REFRESH_SECRET="your-refresh-secret-here"

# Email (ProtonMail)
EMAIL_HOST=smtp.protonmail.ch
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-email-password
EMAIL_FROM=your-email@domain.com

# Frontend
FRONTEND_BASE_URI=YOUR_AWS_FRONTEND_URL
ALLOWED_ORIGINS=http://localhost:5173,YOUR_AWS_FRONTEND_URL,https://fintech-gold-psi.vercel.app

# AWS S3 (if using)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=eu-north-1
AWS_BUCKET_NAME=your-bucket-name

# Tron/Blockchain
TRON_XPUB=your-tron-xpub-key
USDT_CONTRACT=TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf
```

---

### 5️⃣ **Test After Deployment**

#### Test CORS:
1. Open browser console on your frontend
2. Try signup/login
3. Check Network tab - should NOT see CORS errors
4. Backend logs should show: `✅ CORS: Origin allowed - YOUR_URL`

#### Test Email:
1. Try signup with real email
2. Check backend logs for email status
3. Should see: `✅ Email sent successfully to user@example.com`
4. If failed, logs will show exact error with troubleshooting steps

---

## 🔍 Common AWS Issues

### Issue 1: CORS Still Failing
**Problem**: Even after adding URL to ALLOWED_ORIGINS
**Solution**: 
- Make sure environment variables are saved and app is restarted
- Check exact URL (with/without trailing slash)
- Use browser DevTools to see exact origin being sent

### Issue 2: Email Not Sending
**Possible Causes:**
1. **Missing ENV variables** → Set EMAIL_* variables on AWS
2. **SMTP Port Blocked** → AWS by default blocks port 25, but 587 should work
3. **Security Group** → Make sure outbound traffic on port 587 is allowed
4. **ProtonMail Credentials** → Verify credentials are correct

**Quick Test:**
```bash
# SSH into AWS and test with curl
curl -v telnet://smtp.protonmail.ch:587
# Should connect successfully
```

### Issue 3: App Crashes on AWS
**Solution**: Check logs for missing environment variables
```bash
pm2 logs
# Look for: "❌ NOT SET" messages
```

---

## 📝 Quick Deploy Commands

### Update Environment Variables:
```bash
# Via AWS CLI
eb setenv EMAIL_HOST=smtp.protonmail.ch EMAIL_PORT=587 ALLOWED_ORIGINS=http://localhost:5173,YOUR_AWS_URL

# Via SSH
ssh -i your-key.pem ec2-user@your-instance
cd /path/to/app
nano .env  # Edit variables
pm2 restart all
```

### Check Deployment Status:
```bash
# Check if app is running
pm2 status

# View real-time logs
pm2 logs --lines 100

# View startup logs
cat /var/log/your-app/out.log
```

---

## 🎯 Final Checklist

Before going live, verify:

- [ ] AWS Frontend URL added to `ALLOWED_ORIGINS`
- [ ] All EMAIL_* environment variables set
- [ ] Database URL points to production database  
- [ ] `NODE_ENV=production` is set
- [ ] JWT secrets are set (different from local)
- [ ] Security groups allow inbound (80, 443) and outbound (587 for email)
- [ ] Test signup → should receive OTP email
- [ ] Test login → should work without CORS errors
- [ ] Check logs → no error messages on startup

---

## 🆘 Still Not Working?

### Check Server Logs:
The updated code now provides detailed logs. Look for:
- CORS blocked messages with exact URLs
- Email service connection status
- Detailed error messages with troubleshooting steps

### Contact Info:
If issues persist, provide these details:
1. Exact CORS error from browser console
2. Backend logs (last 50 lines)
3. Your AWS frontend URL
4. Email sending error logs

---

## 📞 Quick Debug Commands

```bash
# SSH into AWS
ssh -i your-key.pem ec2-user@your-instance

# Check environment variables are loaded
printenv | grep EMAIL
printenv | grep ALLOWED_ORIGINS

# Test SMTP connection
telnet smtp.protonmail.ch 587

# Check app logs
pm2 logs --lines 50

# Restart app with logs
pm2 restart all && pm2 logs
```
