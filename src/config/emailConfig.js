import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log("📧 Initializing Email Service...");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("Environment:", process.env.NODE_ENV || 'development');
console.log("EMAIL_HOST:", process.env.EMAIL_HOST || '❌ NOT SET');
console.log("EMAIL_PORT:", process.env.EMAIL_PORT || '❌ NOT SET');
console.log("EMAIL_USER:", process.env.EMAIL_USER || '❌ NOT SET');
console.log("EMAIL_SECURE:", process.env.EMAIL_SECURE || 'false');
console.log("EMAIL_FROM:", process.env.EMAIL_FROM || process.env.EMAIL_USER || '❌ NOT SET');
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// ProtonMail SMTP Configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true', // false for 587, true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // Do not fail on invalid certs for ProtonMail
    rejectUnauthorized: false,
  },
  // Connection timeout
  connectionTimeout: 10000,
  // Socket timeout
  socketTimeout: 10000,
});

// Verify connection configuration on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ EMAIL SERVICE CONNECTION FAILED");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("Error:", error.message);
    console.error("Code:", error.code || 'N/A');
    console.error("\n⚠️  Check these:");
    console.error("  1. EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS in .env");
    console.error("  2. SMTP credentials are correct");
    console.error("  3. Network allows SMTP connections");
    console.error("  4. For ProtonMail: Bridge is running (local) or credentials valid (production)");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } else {
    console.log("✅ Email Service is ready to send messages");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }
});

export default transporter;
