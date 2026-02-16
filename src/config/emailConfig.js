const nodemailer = require('nodemailer');
require('dotenv').config();
console.log("EMAIL_HOST VALUE =>", process.env.EMAIL_HOST);
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = transporter;