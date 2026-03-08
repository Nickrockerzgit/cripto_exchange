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
    console.log(`📧 Attempting to send email to ${to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`📨 Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}`);
    console.error(`Error details: ${error.message}`);
    console.error(`Error code: ${error.code || 'N/A'}`);
    
    // Log more details for debugging in production
    if (error.response) {
      console.error(`SMTP Response: ${error.response}`);
    }
    
    // Don't throw error - just return failure so signup doesn't fail
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
}

export { sendEmail };