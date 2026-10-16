#!/usr/bin/env bash
# Release notes coverage: what landed on main since the last release tag that
# the release notes draft does not cite.
#
# Usage: coverage.sh [notes-file] [since-tag]
#   notes-file  default: the newest apps/frontend/src/releases/v*.md
#   since-tag   default: the newest tag reachable from origin/main
#
# Prints two lists:
#   1. merged PRs whose number never appears in the notes file
#   2. commits on main without a "(#N)" PR suffix (direct pushes and the
#      commits of manually merged contributor stacks) for you to triage
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
git fetch -q origin --tags

notes="${1:-$(ls apps/frontend/src/releases/v*.md | sort -V | tail -1)}"
tag="${2:-$(git describe --tags --abbrev=0 origin/main)}"
since="$(git log -1 --format=%cs "$tag")"

echo "notes: $notes"
echo "since: $tag ($since)"

cited="$(grep -oE '#[0-9]+' "$notes" | tr -d '#' | sort -un)"

echo
echo "== Merged PRs not cited in the notes"
gh pr list --state merged --base main --limit 300 \
  --search "merged:>=$since" \
  --json number,title,author,mergedAt \
  --jq '.[] | "\(.number)\t\(.mergedAt[:10])\t@\(.author.login)\t\(.title)"' |
  sort -n |
  while IFS=$'\t' read -r number merged author title; do
    grep -qx "$number" <<<"$cited" || printf '#%s\t%s\t%s\t%s\n' "$number" "$merged" "$author" "$title"
  done

echo
echo "== Commits on main without a PR number (triage: part of a cited PR, tooling, or needs a line)"
git log --no-merges --format='%h%x09%cs%x09%an%x09%s' "$tag..origin/main" |
  grep -vE '\(#[0-9]+\)' |
  grep -viP '\t(translated using weblate|[^\t]*release notes)' || true
