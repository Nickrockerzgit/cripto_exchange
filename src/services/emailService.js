// src/services/emailService.js
import transporter from '../config/emailConfig.js';

/**
 * Send email using ProtonMail SMTP
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @param {Array} attachments - Email attachments (optional)
 * @returns {Object} - Success status and error message if any
 */
async function sendEmail(to, subject, html, attachments = []) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
    attachments,
  };

  try {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📧 Attempting to send email to ${to}...`);
    console.log(`   Subject: ${subject}`);
    console.log(`   From: ${mailOptions.from}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`📨 Message ID: ${info.messageId}`);
    console.log(`   Accepted: ${info.accepted}`);
    console.log(`   Rejected: ${info.rejected}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    return { success: true, messageId: info.messageId, accepted: info.accepted };
  } catch (error) {
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.error(`❌ FAILED TO SEND EMAIL TO ${to}`);
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.error(`Subject: ${subject}`);
    console.error(`Error Message: ${error.message}`);
    console.error(`Error Code: ${error.code || 'N/A'}`);
    console.error(`Command: ${error.command || 'N/A'}`);
    
    // Log more details for debugging in production
    if (error.response) {
      console.error(`SMTP Response: ${error.response}`);
    }
    if (error.responseCode) {
      console.error(`Response Code: ${error.responseCode}`);
    }
    
    console.error(`\n⚠️  Possible issues:`);
    console.error(`  1. Email service not configured properly on AWS`);
    console.error(`  2. Environment variables missing: EMAIL_HOST, EMAIL_USER, EMAIL_PASS`);
    console.error(`  3. SMTP port blocked by firewall`);
    console.error(`  4. Invalid email credentials`);
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    // Don't throw error - just return failure so signup doesn't fail
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      command: error.command
    };
  }
}

export { sendEmail };