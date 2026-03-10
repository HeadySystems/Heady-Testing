#!/usr/bin/env bash
# HEADY_BRAND:BEGIN
# ╔══════════════════════════════════════════════════════════════════╗
# ║  AUTO-COMMIT-PUSH — HCFullPipeline Stage 12                    ║
# ║  ∞ SACRED GEOMETRY ∞  Organic Systems · Breathing Interfaces   ║
# ╚══════════════════════════════════════════════════════════════════╝
# HEADY_BRAND:END
#
# Automatically stages, commits, and pushes all changes to all remotes.
# Called by hcfullpipeline after task completions, file integrations,
# and config updates.
#
# Usage:
#   ./scripts/auto-commit-push.sh [commit-message]
#   ./scripts/auto-commit-push.sh  # uses auto-generated message

set -euo pipefail

REPO_DIR="${HEADY_REPO_DIR:-/home/headyme/Heady}"
REMOTES="${HEADY_REMOTES:-heady-testing staging production}"
BRANCH="${HEADY_BRANCH:-main}"
PIPELINE_FILE="configs/hcfullpipeline.yaml"

cd "$REPO_DIR"

# ─── Count changes ────────────────────────────────────────────────
untracked=$(git ls-files --others --exclude-standard | wc -l)
modified=$(git diff --name-only | wc -l)
staged=$(git diff --cached --name-only | wc -l)
total=$((untracked + modified + staged))

if [ "$total" -eq 0 ]; then
  echo "✓ Nothing to commit — working tree clean"
  exit 0
fi

# ─── Build commit message ────────────────────────────────────────
if [ $# -gt 0 ]; then
  MSG="$*"
else
  # Auto-generate from pipeline version + change counts
  PIPELINE_VER=$(grep 'version:' "$PIPELINE_FILE" | tail -1 | sed 's/.*version: *"\(.*\)"/\1/')
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  MSG="feat: HCFullPipeline v${PIPELINE_VER} auto-commit — ${total} files (${untracked} new, ${modified} modified) [${TIMESTAMP}]"
fi

echo "═══════════════════════════════════════════════════════"
echo "  HEADY AUTO-COMMIT-PUSH"
echo "  Files: ${total} (${untracked} new, ${modified} modified, ${staged} staged)"
echo "  Message: ${MSG}"
echo "═══════════════════════════════════════════════════════"

# ─── Stage all ────────────────────────────────────────────────────
git add -A
echo "✓ Staged all changes"

# ─── Commit ───────────────────────────────────────────────────────
git commit -m "$MSG" --no-verify
echo "✓ Committed"

# ─── Push to all remotes ──────────────────────────────────────────
for remote in $REMOTES; do
  echo -n "  Pushing to ${remote}/${BRANCH}..."
  if git push "$remote" "$BRANCH" 2>/dev/null; then
    echo " ✓"
  else
    # Pull-merge on reject, then retry
    echo " (pulling remote changes first...)"
    git config pull.rebase false 2>/dev/null
    if git pull "$remote" "$BRANCH" --no-edit 2>/dev/null; then
      # Auto-resolve any conflicts by accepting both
      conflicted=$(git diff --name-only --diff-filter=U 2>/dev/null)
      if [ -n "$conflicted" ]; then
        for cf in $conflicted; do
          sed -i '/^<<<<<<< HEAD$/d; /^=======$/d; /^>>>>>>> /d' "$cf"
          git add "$cf"
        done
        git commit --no-edit --no-verify 2>/dev/null
      fi
      if git push "$remote" "$BRANCH" 2>/dev/null; then
        echo "  ✓ ${remote} (after merge)"
      else
        echo "  ✗ ${remote} (failed after merge — manual fix needed)"
      fi
    else
      echo "  ✗ ${remote} (pull failed — manual fix needed)"
    fi
  fi
done

echo "═══════════════════════════════════════════════════════"
echo "  ✓ AUTO-COMMIT-PUSH COMPLETE"
echo "═══════════════════════════════════════════════════════"
