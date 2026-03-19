interface JoinRequestResultTemplateData {
  requesterName: string;
  apiaryName: string;
  approved: boolean;
  dashboardUrl: string;
  appName: string;
}

export function joinRequestResultTemplate(
  data: JoinRequestResultTemplateData,
): { subject: string; html: string } {
  const { requesterName, apiaryName, approved, dashboardUrl, appName } = data;

  const subject = approved
    ? `Your request to join "${apiaryName}" has been approved!`
    : `Your request to join "${apiaryName}" was not approved`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Join Request ${approved ? 'Approved' : 'Denied'}</title>
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
            .status-icon { font-size: 48px; text-align: center; margin-bottom: 16px; }
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
            </div>
            <div class="status-icon">${approved ? '✅' : '❌'}</div>
            <div class="content">
                <p>Hi ${requesterName},</p>
                ${
                  approved
                    ? `<p>Great news! Your request to join <strong>"${apiaryName}"</strong> has been <strong>approved</strong>. You can now access the apiary in ${appName}.</p>
                       <div style="text-align: center;">
                           <a href="${dashboardUrl}" class="button">Open ${appName}</a>
                       </div>`
                    : `<p>Unfortunately your request to join <strong>"${apiaryName}"</strong> was not approved at this time.</p>
                       <p>If you think this was a mistake, you may wish to contact the apiary owner directly.</p>`
                }
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
