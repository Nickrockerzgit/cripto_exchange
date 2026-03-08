import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log("📧 Initializing Email Service...");
console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
console.log("EMAIL_PORT:", process.env.EMAIL_PORT);
console.log("EMAIL_USER:", process.env.EMAIL_USER);

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
    console.error("❌ Email Service Error:", error.message);
  } else {
    console.log("✅ Email Service is ready to send messages");
  }
});

export default transporter;
