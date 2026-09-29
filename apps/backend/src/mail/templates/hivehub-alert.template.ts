export interface HiveHubAlertTemplateItem {
  deviceName: string;
  hiveName: string | null;
  severity: string;
  previousSeverity: string | null;
  category: string;
  title: string;
  description: string;
  confidence: number;
  firstSeenAt: string | null;
}

interface HiveHubAlertTemplateData {
  userName: string | null;
  items: HiveHubAlertTemplateItem[];
  appName: string;
  appUrl: string;
}

const SEVERITY_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  critical: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' },
  warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
  watch: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
  info: { bg: '#f9fafb', border: '#9ca3af', text: '#374151' },
};

/** Alert text comes from HiveHub, so never trust it inside HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-GB', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

function renderItem(item: HiveHubAlertTemplateItem): string {
  const colors = SEVERITY_COLORS[item.severity] ?? SEVERITY_COLORS.info;
  const where = [item.hiveName, item.deviceName].filter(Boolean).join(' · ');
  const escalated = item.previousSeverity
    ? ` <span style="font-weight: 400;">(was ${escapeHtml(item.previousSeverity)})</span>`
    : '';
  const seen = formatTime(item.firstSeenAt);
  return `
      <div style="background-color: ${colors.bg}; border-left: 4px solid ${colors.border}; border-radius: 6px; padding: 16px; margin: 16px 0;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: ${colors.text};">
          ${escapeHtml(item.severity)}${escalated} · ${escapeHtml(item.category)}
        </div>
        <div style="font-size: 17px; font-weight: 600; color: #111827; margin-top: 4px;">${escapeHtml(item.title)}</div>
        <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">${escapeHtml(where)}</div>
        <p style="font-size: 14px; color: #374151; margin: 10px 0 6px;">${escapeHtml(item.description)}</p>
        <div style="font-size: 12px; color: #6b7280;">
          Confidence ${Math.round(item.confidence * 100)}%${seen ? ` · since ${escapeHtml(seen)}` : ''}
        </div>
      </div>`;
}

export function hiveHubAlertTemplate(data: HiveHubAlertTemplateData): {
  subject: string;
  html: string;
} {
  const { userName, items, appName, appUrl } = data;
  const greeting = userName ? `Hi ${escapeHtml(userName)},` : 'Hi,';
  const first = items[0];
  const firstWhere = first.hiveName ?? first.deviceName;
  const subject =
    items.length === 1
      ? `🐝 ${first.title} – ${firstWhere}`
      : `🐝 ${items.length} HiveHub alerts – ${first.title} (${firstWhere}) and more`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HiveHub alert</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 32px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #d97706; margin: 0; font-size: 26px;">🐝 ${escapeHtml(appName)}</h1>
                <h2 style="color: #d97706; margin-top: 8px; font-size: 18px;">HiveHub ${items.length === 1 ? 'alert' : 'alerts'}</h2>
            </div>

            <p>${greeting}</p>
            <p>Your HiveHub sensors raised ${items.length === 1 ? 'an alert' : `${items.length} alerts`} that ${items.length === 1 ? 'needs' : 'need'} a look:</p>

            ${items.map(renderItem).join('\n')}

            <div style="text-align: center;">
                <a href="${escapeHtml(appUrl)}/hivescale" style="display: inline-block; padding: 14px 28px; background-color: #d97706; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">Open HiveHub dashboard</a>
            </div>

            <p style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 14px; font-size: 13px; color: #6b7280;">
                These alerts are computed from sensor data and can be wrong — weather,
                harvesting or an inspection can look like hive activity. Please check the hive before acting.
            </p>

            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #9ca3af;">
                <p>You receive this because HiveHub alert emails are enabled in your ${escapeHtml(appName)} settings.
                An alert is mailed once, and again only if it gets more severe.</p>
                <p><small>This is an automated message. Please do not reply to this email.</small></p>
            </div>
        </div>
    </body>
    </html>
  `;

  return { subject, html };
}
