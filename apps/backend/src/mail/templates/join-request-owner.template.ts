interface JoinRequestOwnerTemplateData {
  requesterName: string;
  requesterEmail: string;
  apiaryName: string;
  approveUrl: string;
  denyUrl: string;
  appName: string;
}

export function joinRequestOwnerTemplate(
  data: JoinRequestOwnerTemplateData,
): { subject: string; html: string } {
  const { requesterName, requesterEmail, apiaryName, approveUrl, denyUrl, appName } = data;

  const subject = `${requesterName} wants to join "${apiaryName}" on ${appName}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Join Request</title>
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
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                text-align: center;
                margin: 10px 8px;
            }
            .button-approve { background-color: #16a34a; color: white; }
            .button-deny { background-color: #dc2626; color: white; }
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
                <h2>Apiary Join Request</h2>
            </div>
            <div class="content">
                <p>Hi there,</p>
                <p><strong>${requesterName}</strong> (<a href="mailto:${requesterEmail}">${requesterEmail}</a>) has requested to join your apiary <strong>"${apiaryName}"</strong>.</p>
                <p>Click <strong>Approve</strong> to accept their request (you'll choose their role), or <strong>Deny</strong> to decline.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${approveUrl}" class="button button-approve">✓ Approve Request</a>
                    <a href="${denyUrl}" class="button button-deny">✗ Deny Request</a>
                </div>
                <p>Or copy and paste these links into your browser:</p>
                <p style="font-size: 13px; color: #666;">Approve: <a href="${approveUrl}">${approveUrl}</a></p>
                <p style="font-size: 13px; color: #666;">Deny: <a href="${denyUrl}">${denyUrl}</a></p>
                <p><small>If you do not recognise this person, you can safely ignore or deny this request.</small></p>
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
