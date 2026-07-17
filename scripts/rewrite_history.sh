#!/usr/bin/env bash
set -e

# Define the dates for the 14 commits (17th July to 22nd July)
DATES=(
  "2026-07-17T10:15:30"
  "2026-07-17T14:45:22"
  "2026-07-18T09:30:00"
  "2026-07-18T13:20:15"
  "2026-07-19T11:05:40"
  "2026-07-19T15:50:12"
  "2026-07-20T10:22:11"
  "2026-07-20T14:15:00"
  "2026-07-21T09:40:05"
  "2026-07-21T15:10:33"
  "2026-07-22T08:12:19"
  "2026-07-22T10:45:00"
  "2026-07-22T12:30:15"
  "2026-07-22T14:00:00"
)

# Get the list of existing commits from oldest to newest
COMMITS=($(git log --reverse --format="%H"))

# Verify we have exactly the number of commits we expect (which is 14)
if [ ${#COMMITS[@]} -ne 14 ]; then
  echo "Expected 14 commits, but found ${#COMMITS[@]}. Continuing anyway..."
fi

# Create a new branch starting from an orphaned state or first commit
# To make it clean, let's create a temporary branch and build it up
git checkout --orphan temp-history-rewrite
git rm -rf . || true

for i in "${!COMMITS[@]}"; do
  COMMIT_HASH=${COMMITS[$i]}
  # If it is the first commit, we need to initialize or checkout files, otherwise cherry-pick
  if [ $i -eq 0 ]; then
    git checkout $COMMIT_HASH -- .
    git add -A
    # Commit with the specified backdated date
    GIT_COMMITTER_DATE="${DATES[$i]}" GIT_AUTHOR_DATE="${DATES[$i]}" \
    GIT_COMMITTER_NAME="Animesh Sharma" GIT_COMMITTER_EMAIL="animeshsharma6565@gmail.com" \
    GIT_AUTHOR_NAME="Animesh Sharma" GIT_AUTHOR_EMAIL="animeshsharma6565@gmail.com" \
    git commit -m "$(git log -1 --format=%B $COMMIT_HASH)"
  else
    git cherry-pick --no-commit $COMMIT_HASH
    git add -A
    # Commit with the specified backdated date
    GIT_COMMITTER_DATE="${DATES[$i]}" GIT_AUTHOR_DATE="${DATES[$i]}" \
    GIT_COMMITTER_NAME="Animesh Sharma" GIT_COMMITTER_EMAIL="animeshsharma6565@gmail.com" \
    GIT_AUTHOR_NAME="Animesh Sharma" GIT_AUTHOR_EMAIL="animeshsharma6565@gmail.com" \
    git commit -m "$(git log -1 --format=%B $COMMIT_HASH)"
  fi
done

# Switch main branch to new branch
git branch -D main || true
git branch -m main
git checkout main
echo "=== History successfully rewritten! ==="
