interface SwarmAlertTemplateData {
  userName: string | null;
  email: string;
  deviceId: string;
  deviceName: string;
  scaleChannel: 'scale_1' | 'scale_2';
  scaleDisplayName: string;
  previousWeightKg: number;
  latestWeightKg: number;
  dropKg: number;
  measurementWindow: number;
  detectedAt: string; // ISO string
  appName: string;
  appUrl: string;
}

export function swarmAlertTemplate(data: SwarmAlertTemplateData): {
  subject: string;
  html: string;
} {
  const {
    userName,
    deviceName,
    scaleDisplayName,
    previousWeightKg,
    latestWeightKg,
    dropKg,
    measurementWindow,
    detectedAt,
    appName,
    appUrl,
  } = data;

  const greeting = userName ? `Hi ${userName},` : 'Hi,';
  const formattedTime = new Date(detectedAt).toLocaleString('en-GB', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const subject = `🐝 Swarm Alert – ${scaleDisplayName} on ${deviceName} lost ${dropKg.toFixed(1)} kg`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Swarm Alert</title>
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
                color: #d97706;
                margin: 0;
                font-size: 28px;
            }
            .alert-box {
                background-color: #fffbeb;
                border: 2px solid #f59e0b;
                border-radius: 8px;
                padding: 20px;
                margin: 24px 0;
                text-align: center;
            }
            .alert-box .drop {
                font-size: 36px;
                font-weight: 700;
                color: #b45309;
            }
            .alert-box .label {
                font-size: 14px;
                color: #78350f;
                margin-top: 4px;
            }
            .data-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                font-size: 14px;
            }
            .data-table td {
                padding: 10px 12px;
                border-bottom: 1px solid #e5e7eb;
            }
            .data-table td:first-child {
                color: #6b7280;
                width: 45%;
            }
            .data-table td:last-child {
                font-weight: 600;
                color: #111827;
            }
            .button {
                display: inline-block;
                padding: 14px 28px;
                background-color: #d97706;
                color: white !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                text-align: center;
                margin: 20px 0;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 13px;
                color: #9ca3af;
            }
            .notice {
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 4px;
                padding: 14px;
                margin: 20px 0;
                font-size: 13px;
                color: #6b7280;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🐝 ${appName}</h1>
                <h2 style="color: #d97706; margin-top: 8px;">Possible Swarm Detected</h2>
            </div>

            <p>${greeting}</p>
            <p>
                A sudden weight drop was detected on <strong>${scaleDisplayName}</strong>
                (device: <strong>${deviceName}</strong>). This may indicate a swarm has left the hive.
            </p>

            <div class="alert-box">
                <div class="drop">−${dropKg.toFixed(1)} kg</div>
                <div class="label">weight lost over ${measurementWindow} measurements</div>
            </div>

            <table class="data-table">
                <tr>
                    <td>Device</td>
                    <td>${deviceName}</td>
                </tr>
                <tr>
                    <td>Scale channel</td>
                    <td>${scaleDisplayName}</td>
                </tr>
                <tr>
                    <td>Weight before</td>
                    <td>${previousWeightKg.toFixed(2)} kg</td>
                </tr>
                <tr>
                    <td>Weight after</td>
                    <td>${latestWeightKg.toFixed(2)} kg</td>
                </tr>
                <tr>
                    <td>Drop</td>
                    <td>${dropKg.toFixed(2)} kg</td>
                </tr>
                <tr>
                    <td>Detected at</td>
                    <td>${formattedTime}</td>
                </tr>
            </table>

            <div style="text-align: center;">
                <a href="${appUrl}/hivescale" class="button">Open HiveScale Dashboard</a>
            </div>

            <div class="notice">
                <strong>Note:</strong> This alert fires when the weight drops by more than your configured
                threshold within a short measurement window. Rain run-off, wind, or harvesting can also
                cause sudden drops — please verify in person.
            </div>

            <div class="footer">
                <p>You are receiving this because swarm alerts are enabled in your ${appName} settings.
                You can adjust or disable them on the HiveScale page.</p>
                <p><small>This is an automated message. Please do not reply to this email.</small></p>
            </div>
        </div>
    </body>
    </html>
  `;

  return { subject, html };
}
