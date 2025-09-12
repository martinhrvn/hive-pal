interface PasswordResetTemplateData {
  email: string;
  resetUrl: string;
  appName: string;
}

export function passwordResetTemplate(data: PasswordResetTemplateData): {
  subject: string;
  html: string;
} {
  const { email, resetUrl, appName } = data;

  const subject = `Reset your ${appName} password`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background-color: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #2563eb;
                margin: 0;
                font-size: 28px;
            }
            .content {
                margin-bottom: 30px;
            }
            .button {
                display: inline-block;
                padding: 14px 28px;
                background-color: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                text-align: center;
                margin: 20px 0;
            }
            .button:hover {
                background-color: #1d4ed8;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e5e5;
                font-size: 14px;
                color: #666;
            }
            .security-notice {
                background-color: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                padding: 15px;
                margin: 20px 0;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${appName}</h1>
                <h2>Password Reset Request</h2>
            </div>
            
            <div class="content">
                <p>Hi there,</p>
                
                <p>We received a request to reset the password for your ${appName} account associated with <strong>${email}</strong>.</p>
                
                <p>If you made this request, click the button below to reset your password:</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #2563eb;"><a href="${resetUrl}">${resetUrl}</a></p>
                
                <div class="security-notice">
                    <strong>Security Notice:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>This link will expire in 1 hour for security reasons</li>
                        <li>If you didn't request this password reset, you can safely ignore this email</li>
                        <li>Your password will not be changed unless you click the link above</li>
                    </ul>
                </div>
                
                <p>If you're having trouble with the button above, copy and paste the URL into your web browser.</p>
            </div>
            
            <div class="footer">
                <p>Best regards,<br>The ${appName} Team</p>
                
                <p><small>This is an automated message. Please do not reply to this email. If you need help, please contact our support team.</small></p>
            </div>
        </div>
    </body>
    </html>
  `;

  return { subject, html };
}
