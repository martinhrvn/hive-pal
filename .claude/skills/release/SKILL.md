---
name: release
description: Prepare and publish a Hive Pal release - check the release notes cover everything merged since the last tag, date them, then create the GitHub release from them.
disable-model-invocation: true
---

# Release (Hive Pal)

A release is two things: the notes file `apps/frontend/src/releases/vX.Y.Z.md`
(shown in the app once deployed) and a published GitHub release `vX.Y.Z <Name>`
targeting `main`. Publishing creates the tag and triggers the backend Docker
build (`.github/workflows/docker-build-backend.yml`). Package versions are not
bumped.

The open **draft** is the newest notes file, with `**Released:** Unreleased`.
Its H1 is `# Version vX.Y.Z <Bee-themed name>`.

## 1. Coverage

Run `.claude/skills/release/coverage.sh` (args: `[notes-file] [since-tag]`,
both default to the newest). It prints:

1. merged PRs whose number the draft never cites
2. commits on `main` without a `(#N)` suffix

Triage every line of both lists into exactly one of:

- **needs a line**: user-visible or self-hoster-visible change
- **covered**: a commit belonging to a PR the draft already cites (manually
  merged contributor stacks land as plain commits; match by topic and date)
- **skip**: release-notes-only, CI/preview/test tooling, reverts of in-cycle work

Done when every line has a verdict; list the verdicts to the user.

## 2. Fill the gaps

For each **needs a line**, read the PR (`gh pr view N --json title,body`) and
write the line from what it changes for users, not how. Match the draft:

- **What's New** feature sections: `- **Bold lead** — what it does (PR #N)`;
  a substantial feature gets its own `###` section.
- **Bug Fixes**: plain sentence, `(PR #N, #issue)` when it closes an issue.
- **Self-Hosting**: new env vars, required versions, proxy/infra changes,
  migrations, anything an operator must do or know.
- **Contributors**: add authors other than `@martinhrvn` with their PR numbers.

Re-run `coverage.sh`; done when list 1 shows only skips.

## 3. Upgrade notes

Collect what can break an existing deployment on upgrade: required runtime
versions, renamed or new required env vars, changed defaults (TLS, auth),
reverse-proxy paths, external service versions, manual steps. Check the
Self-Hosting section and the migrations added since the tag
(`git diff --stat <tag>..origin/main -- apps/backend/prisma/migrations`);
the container runs `prisma migrate deploy` on start, so migrations only need
a mention.

## 4. Date and land the notes

Ask the user for the release date (default today), set
`**Released:** YYYY-MM-DD`, and commit on a branch `release/vX.Y.Z-notes` off
`origin/main`. Push and open the PR:

```
gh pr create --base main --head release/vX.Y.Z-notes --title "Release notes vX.Y.Z" --body "..."
```

If the call is denied, give the user the command to run with `!`. The release
waits until this PR is merged, so the tag contains the dated notes.

## 5. Publish

Build the GitHub release body in the scratchpad: a `## ⚠️ Upgrade notes for
self-hosters` section from step 3 (omit if empty), `---`, then the notes file
without its H1 and `Released` line. Show it to the user, then:

```
gh release create vX.Y.Z --target main --title "vX.Y.Z <Name>" --notes-file <body-file>
```

Publishing is outward-facing (tag, Docker images): run it only on the user's
go-ahead, and hand them the command if the call is denied. Afterwards confirm
the `docker-build-backend` run started (`gh run list --workflow docker-build-backend.yml --limit 1`).

## 6. Next draft

Create `vX.(Y+1).0.md` with the H1 (ask for the name, or leave
`<Name>`), `**Released:** Unreleased` and the empty section headings, so
every PR merged from now on gets its line there.
