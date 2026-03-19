interface ApiaryInviteTemplateData {
  inviteUrl: string;
  apiaryName: string;
  inviterName: string;
  appName: string;
}

export function apiaryInviteTemplate(data: ApiaryInviteTemplateData): {
  subject: string;
  html: string;
} {
  const { inviteUrl, apiaryName, inviterName, appName } = data;

  const subject = `${inviterName} invited you to join "${apiaryName}" on ${appName}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Apiary Invitation</title>
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
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #f59e0b; margin: 0; font-size: 28px; }
            .button {
                display: inline-block;
                padding: 14px 28px;
                background-color: #f59e0b;
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
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🐝 ${appName}</h1>
                <h2>You have been invited!</h2>
            </div>
            <div class="content">
                <p>Hi there,</p>
                <p><strong>${inviterName}</strong> has invited you to collaborate on the apiary <strong>"${apiaryName}"</strong> in ${appName}.</p>
                <p>Click the button below to accept the invitation:</p>
                <div style="text-align: center;">
                    <a href="${inviteUrl}" class="button">Accept Invitation</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #f59e0b;"><a href="${inviteUrl}">${inviteUrl}</a></p>
                <p><small>If you did not expect this invitation, you can safely ignore this email.</small></p>
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
