---
title: Import & Export
description: Back up or migrate your Hive-Pal account by exporting all your data to a zip file and importing it again, with job history tracking.
keywords: [hive-pal export, data backup, import beekeeping data, migrate account, data transfer]
---

# Import & Export

Export your entire account to a zip file for a personal backup or to migrate to another Hive-Pal instance, then import it back when you need to.

## When to Use It

- Keeping your own off-server backup of your beekeeping records.
- Moving your data to a different Hive-Pal installation.
- Archiving a season's records.

## Exporting Your Data

1. Go to **Settings → Data Transfer** (`/settings/data-transfer`).
2. Start an **export**. The job runs in the background — large accounts can take a little while.
3. When the job shows **completed**, download the zip file.

## Importing Data

1. On the same page, choose **import** and select a previously exported zip file.
2. The import runs as a background job; watch its status in the job history.

## Job History

The Data Transfer page lists your export and import jobs with their status — **pending, running, completed,** or **failed** — so you can download finished exports or remove old jobs.

:::tip Server backups are separate
This account-level export is for your convenience. If you self-host, you should **also** keep regular server-side database backups — see [Backup & Restore](../self-hosting/backup-restore).
:::

## FAQ

**What's included in the export?**
Your account's beekeeping data — apiaries, hives, inspections, queens, and related records — packaged as a zip.

**Can I import into a different Hive-Pal instance?**
Yes, that's a primary use case for migrating between servers.

**Is HiveScale data included?**
HiveScale measurement data lives on the HiveScale backend, which remains its source of truth. See [HiveScale](./hivescale).
