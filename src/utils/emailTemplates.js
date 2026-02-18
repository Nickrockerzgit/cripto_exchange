function emailVerificationTemplate(otp) {
  return `
    <html>
      <body>
        <h1>Email Verification</h1>
        <p>Your OTP for email verification is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 10 minutes.</p>
      </body>
    </html>
  `;
}

// src/utils/emailTemplates.js
function twoFactorSetupTemplate() {  // Ab qrCodeUrl pass nahi karna, baad mein handle karenge
  return `
    <html>
      <body>
        <h1>2FA Setup</h1>
        <p>Scan this QR code with your authenticator app (e.g., Google Authenticator):</p>
        <img src="cid:qr-code" alt="QR Code" style="max-width: 200px;" />
        <p>If the image doesn't show, enable "Display images" in Gmail settings or reply for help.</p>
      </body>
    </html>
  `;
}

function twoFactorLoginTemplate() {
  return `
    <html>
      <body>
        <h1>2FA Login Alert</h1>
        <p>A login attempt was made to your account. If this was you, proceed with the 2FA code from your app.</p>
      </body>
    </html>
  `;
}

export  {
  emailVerificationTemplate,
  twoFactorSetupTemplate,
  twoFactorLoginTemplate,
};