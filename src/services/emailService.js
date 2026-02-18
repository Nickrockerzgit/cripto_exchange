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
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending email: ${error}`);
    throw new Error('Failed to send email');
  }
}

export  { sendEmail };