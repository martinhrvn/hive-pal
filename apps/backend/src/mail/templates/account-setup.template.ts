interface AccountSetupTemplateData {
  email: string;
  setupUrl: string;
  appName: string;
  expiresInHours: number;
}

export function accountSetupTemplate(data: AccountSetupTemplateData): {
  subject: string;
  html: string;
} {
  const { email, setupUrl, appName, expiresInHours } = data;

  const subject = `Your ${appName} account is ready`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your ${appName} account</title>
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
            a.button { color: white; }
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
                <h2>Set up your account</h2>
            </div>
            <p>Hi there,</p>
            <p>An administrator created a ${appName} account for <strong>${email}</strong>. Choose a password to start using it.</p>
            <div style="text-align: center;">
                <a href="${setupUrl}" class="button">Set your password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;"><a href="${setupUrl}">${setupUrl}</a></p>
            <div class="security-notice">
                <strong>Security notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>This link expires in ${expiresInHours} hours. After that, ask your administrator for a new one.</li>
                    <li>It can only be used once.</li>
                    <li>If you weren't expecting this account, you can ignore the email.</li>
                </ul>
            </div>
            <div class="footer">
                <p>Best regards,<br>The ${appName} Team</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return { subject, html };
}
