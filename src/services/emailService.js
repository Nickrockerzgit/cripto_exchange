// src/services/emailService.js
import transporter from '../config/emailConfig.js';

async function sendEmail(to, subject, html, attachments = []) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    attachments,  // <-- Yeh add kar
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error.message);
    // Don't throw error - just log it so signup doesn't fail
    return { success: false, error: error.message };
  }
}

export  { sendEmail };