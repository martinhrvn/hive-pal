---
title: Account & Settings
description: Manage your Hive-Pal account — change your password, manage files and uploads, and configure preferences.
keywords: [hive-pal account, change password, user settings, file management, preferences]
---

# Account & Settings

Manage your account and personal preferences from the **Settings** area (`/settings`).

## Changing Your Password

Update your password from your account settings (`/account/change-password`). On some installations you may be prompted to change a password on first login (for example, the seeded admin account).

## Files

The **Files** page (`/files`) lists documents and uploads associated with your account. Where files live depends on your server's [storage configuration](../self-hosting/configuration#file-storage) — local disk or S3-compatible storage.

## Data Transfer

Export your whole account or import a previous export from **Settings → Data Transfer**. See [Import & Export](./import-export).

## Sign-In Methods

Add a [passkey](./login#passkeys) or rely on password and [magic-link](./login#magic-link) sign-in. See [Logging In](./login).

## FAQ

**How do I export everything?**
Use [Import & Export](./import-export) for a full account zip. Self-hosters should also keep [server backups](../self-hosting/backup-restore).

**Where are my uploaded photos and audio stored?**
In your server's configured storage backend — see [Configuration → File Storage](../self-hosting/configuration#file-storage).
