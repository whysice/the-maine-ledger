# CLAUDE.md

Agent instructions for this repository. The full standard is GIT_SOURCE_OF_TRUTH.md in this same folder; the rules below are the subset you must follow on every run. If the two ever disagree, GIT_SOURCE_OF_TRUTH.md wins and this file needs a fix.

Read README.md before starting. It has the commands to install, run, and test this project.

## Before you touch anything

1. Run `git status`. If the working tree is not clean, stop and report exactly what is there. Do not stash, reset, or discard it.
2. Run `git branch --show-current`. If it prints main, do not commit anything. Create a branch first (next section).
3. Confirm the task is one concern. If the request contains two unrelated changes, say so and ask which one belongs on this branch.

## Branches

- Never commit to main. No exceptions, including one-line fixes.
- Branch from fresh main:

```
git switch main
git pull
git switch -c <type>/<issue>-<short-description>
```

- Types: feat, fix, chore, docs, refactor, test, hotfix. Lowercase, hyphens. Example: fix/57-login-redirect
- One branch, one concern. A second concern gets a second branch after this one is pushed.
- Keep the branch current at least once per session with `git fetch origin` then `git rebase origin/main`. If the rebase conflicts and you cannot resolve it with certainty, run `git rebase --abort` and report the conflicting files.

## Before coding: the changelog line

Add one line under the Unreleased heading in CHANGELOG.md stating what this branch will do, under the group that fits (Added, Changed, Fixed, Removed, Deprecated, Security). Write it before the first code change. If you cannot write the line, the scope is unclear; ask.

## Commits

- Work in small steps. After each step that works, run the project's tests, then commit. Do not stack untested steps.
- Before every commit, show `git status` and `git diff --stat` and wait for approval. The diff is the deliverable; your summary of it is not.
- Run `git diff --check` before committing and fix any whitespace errors it reports.
- Each commit is one logical change. Use `git add -p` to split a file's edits when one file carries two changes.
- Message format:
  - Subject line: imperative mood, capitalized, about 50 characters or fewer, no trailing period. "Add", "Fix", "Remove", not "Added" or "Fixes". Never "Update files", "WIP", "changes", or "fix" on its own.
  - Blank line.
  - Body wrapped at about 72 characters: why the change was made and what the behavior was before.
  - Trailers last:

```
Co-authored-by: Claude <noreply@anthropic.com>
Closes #<issue>
```

  Include Closes only when the branch fully resolves the issue.
- Never commit: .env or any file holding credentials, node_modules or other installed dependencies, build output, OS metadata, editor settings, large binaries. Check that .gitignore covers them; if it does not, add the entry in its own commit before anything else.

## Forbidden without the human typing explicit confirmation in the chat

- `git push --force` in any form. `--force-with-lease` is allowed only on your own branch, only after rebasing it, and only after asking.
- `git reset --hard`
- `git checkout -- .` or `git restore .` or any whole-tree discard
- `git clean -fd`
- `git rebase` or `git commit --amend` touching any commit that has been pushed
- `git branch -D`
- Deleting, renaming, or editing anything under .git
- Deleting, skipping, or weakening a test to make the suite pass
- Changing CI configuration, branch protection, or anything under .github unless that is the assigned task

If the task seems to require one of these, stop, explain why, and wait.

## Pushing and pull requests

- Push with `git push`. The first push of a new branch may need `git push -u origin <branch>`.
- When asked to open a pull request, the body must contain: what changed and why in two to five sentences; how it was tested, meaning the command and its result or the manual steps and what was observed; the CHANGELOG line; the linked issue. The title must be a valid commit subject line.
- Never merge a pull request. The human merges after review.

## Secrets

- Never print the contents of .env or any credentials file, even when asked to debug it. Refer to variable names only.
- If you find a secret already committed, stop and report it. Do not try to remove it from history yourself.

## Session end

Report: the branch name, whether `git status` is clean, whether the branch is pushed, and anything left uncommitted with the reason. Never end a session with uncommitted work unreported.
