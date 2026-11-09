# Git Source of Truth

Version 1.0.0, 2026-11-09.
Reference text: Pro Git, 2nd edition (Chacon and Straub), the copy in this project. Section and page references below point at that copy.

## 0. How to use this file

- This file is the standard. If a repository's practice and this file disagree, the repository is wrong until this file is changed through a reviewed pull request.
- Two readers: the person doing the work and the person checking it. Sections 1 to 9 are for doing. Section 10 is the audit protocol for checking. Sections 11 to 14 are reference.
- Rules marked "documented" come from Pro Git or git's own manual pages. Rules marked "practice" are working heuristics; they hold up, but they are judgment, not law, and each one says why.
- Keep a copy in every repository root. The copy in this project is canonical. Repository copies carry the version line at the top so drift is visible at a glance.
- Assumes GitHub hosting and GitHub names (pull request, branch protection, CODEOWNERS). GitLab and Bitbucket have equivalents under other names; every git command here is identical across hosts.

## 1. Non-negotiables

Ten rules. Everything else in this file elaborates one of them.

1. Nobody commits directly to main. All work reaches main through a pull request. Branch protection makes this true for humans and AI agents alike.
2. One branch per unit of work, one unit of work per branch. The branch is deleted after merge.
3. Every commit is one logically separate change with a message that says why (Pro Git 5.2, documented).
4. Never rewrite history on a shared branch. Pro Git's single-sentence rule (3.6): do not rebase commits that exist outside your own repository and that other people may have based work on. Your own topic branch, before anyone else has pulled it or a reviewer has started reading, is not shared.
5. Nothing merges without evidence it was tested. Red CI blocks merge. A pull request with no test evidence is not ready for review.
6. CHANGELOG.md and a version number exist before the first feature is written. Every pull request that changes behavior adds a line under Unreleased before the code is written.
7. Secrets never enter a commit. If one does, rotate it first, then clean history.
8. Releases are annotated tags in SemVer form (vMAJOR.MINOR.PATCH) on main (Pro Git 2.6, documented).
9. Same name and same email in git config on every machine you commit from. Authorship in the log is the attribution record.
10. The working tree is clean at the start and end of every working session. "nothing to commit, working tree clean" or you are not done.

## 2. Machine setup (once per machine)

```
git config --global user.name "Full Name"
git config --global user.email "you@domain.org"
git config --global init.defaultBranch main
git config --global pull.rebase true
git config --global push.autoSetupRemote true
git config --global rerere.enabled true
git config --global fetch.prune true
git config --global core.autocrlf input
git config --global diff.colorMoved default
```

What each line buys you:

- user.email: use the address verified on your GitHub account, and the same one everywhere. Practice tell: two emails for one person in the log means their machines are configured differently; it splits their contribution graph and breaks any per-person blame. Fix the config going forward; a .mailmap file at the repo root maps the stray address to the right one without rewriting history (documented, git-shortlog and git-blame honor it).
- pull.rebase true: git pull replays your local commits on top of the remote instead of creating a merge commit. Removes the "Merge branch 'main' of github.com..." noise from topic branches.
- push.autoSetupRemote true: first push of a new branch sets upstream without -u. Needs git 2.37 or later.
- rerere.enabled true: git remembers how you resolved a conflict and replays the resolution if the same conflict recurs during a rebase (Pro Git 7.9, documented).
- fetch.prune true: branches deleted on the remote disappear from your remote-tracking list on fetch.
- core.autocrlf: input on macOS and Linux, true on Windows. Combined with .gitattributes in section 3, line endings stop churning between machines.
- diff.colorMoved default: moved lines render in a different color from changed lines, so a refactor that moves a block reads as a move.

Verify with `git config --global --list`.

Commit signing is recommended, not required, for everyday commits. It is required on release tags (section 8). SSH signing is the simplest path on git 2.34 or later:

```
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
```

Then add the same public key to GitHub as a signing key. Pro Git 7.4 covers the GPG route.

## 3. Repository setup (once per repository)

Every item present before the first feature commit:

- README.md: what the project is, how to run it locally, how it deploys, who owns it.
- .gitignore in the very first commit, before any other file is added. Start from the GitHub gitignore template for the stack; add .env and .env.*, build output, node_modules or the language equivalent, and OS metadata. Practice tell: node_modules or a dist folder in history means the ignore file came second. The fix is `git rm -r --cached <path>` plus the ignore entry; the history keeps the weight forever unless rewritten.
- .gitattributes with `* text=auto eol=lf` and binary markers for images, fonts, and archives (Pro Git 8.2, documented).
- CHANGELOG.md in Keep a Changelog format with an Unreleased heading from day one (section 8).
- A version source: the version field in package.json, a VERSION file, or pyproject.toml. Starts at 0.1.0.
- LICENSE, decided and committed before any outside contributor pushes. Practice: ownership questions get settled by LICENSE plus commit authorship, and both have to exist before the question arises.
- CODEOWNERS listing who must review which paths.
- Branch protection on main (GitHub: repository Settings, then Rules or Branches; the menu location moves between redesigns): require a pull request, require at least one approval, require status checks to pass, require the branch to be up to date before merging, block force pushes, block deletion, require linear history, and do not allow administrators to bypass.
- One merge method enabled and the other two disabled (section 7).
- Automatic branch deletion on merge turned on.
- CI on every pull request: install, lint, test, build, at minimum. A deploy preview per pull request if the host provides one (Netlify, Vercel, and Cloudflare Pages all do).
- A pre-commit hook manager committed to the repo (husky, lefthook, or pre-commit) running the fast checks. Hooks live in .git/hooks and are not copied on clone (Pro Git 8.3, documented), so the manager installs them and the server-side CI remains the enforcement.

## 4. Branching model

Trunk-based with short-lived topic branches. Pro Git 3.4 describes two patterns, long-running branches (main plus a develop or next branch) and topic branches. This standard uses topic branches only and no develop branch. Reason: small teams doing AI-assisted work produce many small changes; a second integration branch adds a step without adding safety once CI runs on every pull request.

Rules:

- main is always deployable. If main is red, fixing main is the only work until it is green.
- Branch from current main:

```
git switch main
git pull
git switch -c feat/42-csv-export
```

- Names: feat/, fix/, chore/, docs/, refactor/, test/, hotfix/. Lowercase, hyphens, issue number first when there is one.
- One branch, one concern. Find a second bug while working? Commit or stash what you have, open a second branch for it.
- Branch life is measured in days, not weeks (practice). A branch open more than a week is diverging from main; rebase it onto origin/main daily or split it.
- Delete after merge, locally and remotely:

```
git branch -d feat/42-csv-export
git push origin --delete feat/42-csv-export
```

- Hotfix: branch from main, fix, pull request, merge, tag a patch release. Same path as everything else, higher priority.
- Experiments go on branches and get shown before they get merged. Pro Git 3.4's point is that throwing a branch away is free, which is exactly why experiments belong on one.

When a long-running branch is justified: a release branch for a shipped version you must patch while main has moved on. Name it release/1.x. Fixes land on main first and are cherry-picked back to the release branch (practice: fix forward, backport, never the reverse, or main silently loses the fix).

## 5. Commit standard

From Pro Git 5.2, Commit Guidelines (documented):

1. No whitespace errors. Run `git diff --check` before committing.
2. Each commit is one logically separate changeset. Use `git add --patch` to split one file's edits across two commits (Pro Git 7.2).
3. Message format: a first line of about 50 characters or fewer, capitalized, in the imperative mood ("Add", "Fix", "Remove", not "Added" or "Fixes"), no trailing period. A blank line. A body wrapped at about 72 characters that explains the motivation and contrasts the change with the previous behavior.

Example message (illustrative, not from a real repo):

```
Add retry with backoff to the upload client

Uploads over the rural connection failed on the first timeout and the
user had to restart the whole batch. The client now retries three times
with exponential backoff before surfacing the error. Previously there
was no retry at all.

Closes #42
```

Install it as the default template:

```
git config --global commit.template ~/.gitmessage
```

with ~/.gitmessage holding the blank skeleton (subject, blank line, body, blank line, trailers).

Prefix convention: Conventional Commits (feat:, fix:, chore:, docs:, refactor:, test:) is compatible with the above as long as the subject stays under about 50 characters. Adopt it per repository and record the choice in the README. Benefit: changelog and release tooling can parse history. Cost: people pad the subject to fit the prefix. Either way, the rules above still apply.

Trailers:

- Closes #N links and auto-closes the issue on merge.
- Co-authored-by: Name <email> for pair work and for AI agents (section 11). GitHub renders co-authors on the commit.
- Signed-off-by only if the repository adopts a Developer Certificate of Origin.

Never commit: generated files, installed dependencies, .env files, credentials, large binaries (Git LFS if unavoidable), editor settings, OS metadata.

Amend and squash: `git commit --amend` and `git rebase -i` are for commits not yet on a shared branch (Pro Git 7.6). Cleaning up your own pull request branch before anyone reviews it is encouraged. Once a reviewer has started, add fixup commits instead and squash at merge, so their comments still line up with the diff.

## 6. Daily loop

1. Start clean. `git status` shows a clean tree. If it does not, finish the work, stash it with a name, or discard it on purpose.
2. Sync: `git switch main` then `git pull`.
3. Branch: `git switch -c feat/42-thing`.
4. Write the CHANGELOG line under Unreleased first, as a statement of what you are about to build. If you cannot write the line, the scope is not clear yet; stop and define it. This is where "versioning and changelog before coding" lives in practice.
5. Work in small steps. After each step that works: `git diff --check`, `git add -p`, commit with a section 5 message.
6. Test the step before starting the next one. Untested steps stacked on each other cannot be isolated when the stack fails.
7. Stay current. At least daily on your branch:

```
git fetch origin
git rebase origin/main
```

This is allowed under rule 4 because the branch is yours and nobody has built on it. Conflicts resolved daily are small; conflicts resolved at the end are not.

8. Push with `git push`. After rebasing a branch you had already pushed, use `git push --force-with-lease`, never bare --force. --force-with-lease refuses to overwrite if the remote moved since you last fetched (documented, git-push).
9. Open the pull request when the CHANGELOG line is true.
10. End clean. `git status` clean and the branch pushed. Anything else is lost work waiting for a disk failure.

## 7. Pull requests and review

The pull request body must contain:

- What changed and why, in two to five sentences. Duplicating the commit body is fine.
- How it was tested: the command run and its result, or the manual steps with expected and observed, or the deploy preview URL and what was checked there. "Tested locally" with no specifics does not count.
- Screenshots for anything visual.
- The CHANGELOG line, or the words "no user-facing change".
- The linked issue.

Size: one sitting's worth of reading. Practice: past a few hundred changed lines a diff gets skimmed rather than reviewed. Split by concern, not by file.

Reviewer protocol, in order:

1. Read the description first. If test evidence is missing, request changes without opening the code.
2. Check the branch out (`gh pr checkout <number>`) and run it. The reviewer runs the code. Approval on reading alone is acceptable only for documentation-only changes.
3. Read commit by commit when the commits are atomic (section 5). If they are not, read the whole diff and note that the merge will be a squash.
4. Does the diff do what the description says and nothing else? Scope creep is a reject reason even when the extra change is good; it goes in its own pull request.
5. Look for secrets, leftover debug output, commented-out code, TODOs with no issue, dependency changes not mentioned in the description, lockfile churn. Practice tell: lockfile churn in a pull request that did not touch dependencies means someone ran install with a different package manager version; it is noise that hides real dependency changes.
6. Check the CHANGELOG line and whether the version impact (patch, minor, major) matches it.
7. Approve, or request changes with specifics. "Looks good" with no evidence the reviewer ran it is not an approval under this standard.

Merge method: squash and merge for topic branches, so every commit on main is one reviewed, tested, changelog-covered change and `git revert` of a whole feature is one command. Rebase and merge when the branch's commits are already atomic and worth keeping individually. Plain merge commits are off (require linear history). Trade-off, stated plainly: squashing means `git bisect` on main lands on a pull request rather than a single commit; keeping pull requests small is what makes that acceptable.

Write the squash commit message to the section 5 standard. GitHub prefills it with every branch commit message concatenated, which is almost never right. The pull request title becomes the subject line, so make the title a valid subject line from the start.

The author merges after approval, not the reviewer, so the author is watching when CI finishes and the deploy lands (practice). Branch auto-deletes on merge.

## 8. Versioning, changelog, releases

Versioning: Semantic Versioning 2.0.0. MAJOR for breaking changes, MINOR for backward-compatible additions, PATCH for backward-compatible fixes. Before 1.0.0 anything may change, but still bump MINOR for features and PATCH for fixes so the history reads correctly.

Changelog: Keep a Changelog format. Headings: Unreleased, then one heading per version with its date as YYYY-MM-DD. Under each: Added, Changed, Deprecated, Removed, Fixed, Security, using only the groups that apply. Written for the people who use the software, not generated from commit messages. Commit messages explain to developers; changelog entries explain to users.

Release procedure:

1. Confirm main is green and your working tree is clean.
2. Move the Unreleased entries under a new version heading with today's date. Add a fresh, empty Unreleased heading above it.
3. Bump the version source in the same commit. Subject line: "Release v1.4.0".
4. Open a pull request like any other change, get the fast review, merge.
5. On main after merge:

```
git switch main
git pull
git tag -a v1.4.0 -m "v1.4.0"
git push origin v1.4.0
```

Annotated, not lightweight. Annotated tags are full objects carrying tagger, date, and message, and they can be signed and verified; lightweight tags are bare pointers (Pro Git 2.6, documented). Lightweight tags are for local bookmarks only.

6. Create the GitHub Release from the tag and paste the changelog section as the body.
7. `git describe --tags` on any later commit now returns an identifier like v1.4.0-12-gabc1234: the last tag, how many commits since, and the abbreviated hash (Pro Git 5.3, documented). Surface that string in the app's footer or about page so a bug report tells you exactly what was running.

Checks: `git tag -l "v*"` lists releases. `git show v1.4.0` shows a Tagger line for an annotated tag and no Tagger line for a lightweight one. A release tag with no Tagger line gets deleted and recreated annotated.

## 9. Testing gates

The rule: every feature is tested piece by piece before it ships. In practice:

- Each commit on a pull request branch leaves the project working: tests pass, the app builds. Practice tell: `git bisect` only works when this is true. A history full of broken intermediate commits cannot be bisected, and bisect is the first tool you reach for when something regresses.
- Test the piece before building the next piece. Untested pieces stacked on each other cannot be isolated when the stack fails (same point as section 6 step 6; it is here because it is a gate, not a habit).
- "Tested" means one of: an automated test added or extended and passing in CI; a documented manual test with steps, expected, and observed in the pull request; or a deploy preview check with the URL and what was verified. Use the strongest one available and write it down.
- CI is required on every pull request and must be green to merge. A flaky test gets fixed or quarantined with an issue, never retried into green.
- Pre-commit hooks run the fast checks (lint, format, whitespace, secret scan) so the branch fails locally instead of in CI. Because client-side hooks are not copied on clone (Pro Git 8.3), the committed hook manager installs them and CI remains the enforcement.
- Hotfixes follow the same gate. Urgency is a reason to review faster, not to skip the test.

## 10. Checking someone's git work: the audit protocol

Use this when reviewing a contributor's branch, onboarding to a repository you did not build, or taking over a codebase. Run the steps in order. Each has the command, what good looks like, and the tells.

### 10.1 State of the tree

```
git status
git stash list
```

Good: clean tree, empty stash list.
Tells: stash entries older than the current branch are abandoned work. Practice: a stash is a scratchpad, not storage; anything worth keeping is a commit on a branch. Untracked files in a shared clone usually mean the ignore file is incomplete.

### 10.2 Shape of history

```
git log --oneline --graph --decorate --all -n 40
```

Good: main is a straight line of squash or atomic commits; topic branches are short and land cleanly.
Tells (practice):

- Repeated "Merge branch 'main' of github.com:..." commits on a topic branch: pulling with merge instead of rebase. Fix: pull.rebase true (section 2).
- Braided history with long parallel lines on a two- or three-person project: branches living too long.
- Many commits titled "fix", "update", "wip", "changes" on main: no squash discipline and nobody reading commit messages at review.
- One commit touching dozens of files across unrelated directories: several changes glued together. Confirm with `git show --stat <sha>`.

### 10.3 Commit quality on the branch under review

```
git log origin/main..HEAD --format='%h %an %ad %s' --date=short
git log origin/main..HEAD --stat
git diff --check origin/main...HEAD
```

Good: every subject line passes section 5; no whitespace errors; file counts per commit are small. Read the subject lines top to bottom as a list. They should tell the story of the branch without opening a single diff.

### 10.4 What actually changed

```
git diff origin/main...HEAD --stat
git diff origin/main...HEAD
```

Three dots in git diff means the changes since the branch diverged from main (from the merge base to the branch tip), not the raw difference between the two tips (documented, git-diff; Pro Git 7.1 covers the matching range syntax for git log). Read for files outside the stated scope, dependency and lockfile changes, deleted or skipped tests, configuration changes, and anything under .github or the CI configuration.

### 10.5 Authorship and attribution

```
git shortlog -sne origin/main..HEAD
git log --format='%an <%ae> | %cn <%ce>' origin/main..HEAD | sort | uniq -c
```

Good: one author with one email, or Co-authored-by trailers where two people worked. Author and committer differing after a rebase or cherry-pick is normal, not a flag (documented; the author is who wrote it, the committer is who last applied it).
Tells: an email that is not the person's known address; commit dates at implausible times (a clock or timezone misconfiguration, or a rewritten date); authorship claimed by one person on work another person wrote (check Co-authored-by trailers and the pull request conversation). The log is the attribution record. Anything that does not match it is a conversation to have, not an assumption to make.

Who last touched specific lines, ignoring whitespace and following moves across files:

```
git blame -w -C -C -M path/to/file
```

(Pro Git 7.10.) When a string was introduced or removed, anywhere in history:

```
git log -S'the string' --oneline
```

(Pro Git 7.5, the pickaxe.)

### 10.6 Secrets and weight

```
git log --all --diff-filter=A --name-only --format='' | sort -u | grep -Ei '\.env|secret|credential|\.pem$|\.key$|id_rsa'
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sort -k3 -n | tail -20
```

First command: every file ever added whose name suggests a secret. Second: the twenty largest objects in history. Run gitleaks or trufflehog for content scanning; the filename grep only catches the careless cases.

If a secret is found: rotate it first, today. Then remove it from history with git filter-repo (the maintained successor to filter-branch, which Pro Git 7.6 describes). Then force-push with the whole team informed and every clone re-cloned. Practice: rewriting history without rotating the secret is theater, because everyone who fetched already has it.

### 10.7 Remote hygiene

```
git fetch --prune
git branch -r
git branch --merged origin/main
git branch --no-merged origin/main
```

(Pro Git 3.3.) Good: few remote branches, all recent. Merged branches still present should be deleted. Unmerged branches older than the current sprint need a named owner or deletion.

### 10.8 Protection and process (on the host)

Open the repository settings and confirm: main protected, pull request required, approval required, status checks required, force push blocked, one merge method enabled, automatic branch deletion on. Then open the last several merged pull requests: did each have a description with test evidence, a review with actual comments, and green checks?
Practice tell: pull requests approved within a minute of opening by the same two people trading approvals is rubber-stamping. The fix is the reviewer-runs-the-code rule in section 7.

### 10.9 Releases

```
git tag -l --sort=-v:refname | head
git describe --tags
```

Good: tags in SemVer form, each annotated (`git show <tag>` shows a Tagger line), each matching a CHANGELOG heading with the same date.
Tell: CHANGELOG versions with no tag, or tags with no CHANGELOG entry, means the release procedure in section 8 is being skipped.

### 10.10 Verdict

Write it as: state (clean, needs work, or unsafe), the three most important findings ranked by weight, and the specific commands or pull requests that would fix them. Unsafe means a secret in history, force-pushes to main, or an unprotected main with direct commits. Unsafe stops all other work until it is fixed.

## 11. Working with AI coding agents

Agents (Claude Code, Cursor, Copilot, Codex, and the like) make commits fast and have no sense of when not to. Rules:

1. The agent works on a topic branch the human created or named. It never has push access to main, and branch protection makes that true even when its credentials would allow it.
2. Before any commit the agent shows `git status` and `git diff --stat`, and the human reads them. The diff is the deliverable; the agent's summary of the diff is not.
3. One task per agent session per branch. A session that drifts into a second concern gets a second branch.
4. Agent commits carry a Co-authored-by trailer naming the tool, so authorship stays honest and auditable under section 10.5. The human remains the author and is accountable for every line.
5. The agent never runs `git push --force`, `git reset --hard`, `git checkout -- .`, `git clean -fd`, `git rebase` on a pushed branch, or any other history rewrite or destructive command without the human typing the confirmation. Put this in the agent's project instructions file (CLAUDE.md, .cursorrules, AGENTS.md, or the tool's equivalent) so it is in force on every run, not just the runs where someone remembers.
6. The commit standard (section 5) and the branch name pattern (section 4) go in that same instructions file. Agents follow them when told; left alone they write "Update files".
7. Secrets never go in prompts or in files the agent can read into a commit. .env is ignored and the agent is told not to print it.
8. Review agent pull requests harder, not softer. Agents produce plausible code with confident descriptions, and the reviewer-runs-the-code rule is the defense. Practice tells: unrequested refactors in the same diff, new dependencies not mentioned in the description, tests that assert the implementation rather than the behavior, and tests deleted or skipped to make CI pass.
9. Session end: the agent reports `git status` clean and the branch pushed, or lists exactly what is uncommitted and why.

## 12. Recovery

Decision rule first. If the commit has been pushed to a shared branch, use revert, which adds a new commit that undoes it. If it is local, or on your own unshared branch, reset or amend is fine. Pro Git 7.7 explains exactly what reset does to HEAD, the index, and the working tree; read it once and the table below stops being magic.

| Situation | Do this | Note |
|---|---|---|
| Committed on main by mistake, not pushed | `git branch feat/x` then `git reset --hard origin/main` then `git switch feat/x` | The branch pointer saves the work; main goes back to the remote |
| Committed to the wrong branch, not pushed | `git switch right-branch`, `git cherry-pick <sha>`, switch back, `git reset --hard HEAD~1` | |
| Wrong message on the last commit, not pushed | `git commit --amend` | Pro Git 2.4 |
| Staged the wrong file | `git restore --staged <path>` | |
| Discard local edits to a file | `git restore <path>` | Destructive, no undo |
| Bad commit already on main | `git revert <sha>`, then a pull request | Never reset a shared main |
| Lost a commit after a reset or branch delete | `git reflog`, find the hash, `git branch recover <hash>` | Pro Git 10.7. Reflog entries expire after about 90 days by default, unreachable ones after about 30 (git-gc, documented) |
| Rebase went wrong mid-way | `git rebase --abort` | Returns to the pre-rebase state |
| Merge conflict and you want out | `git merge --abort` | |
| Need to switch branches with half-done work | `git stash push -m "what this is"`, later `git stash pop` | Pro Git 7.3. Name it or you will not know what it was |
| Which commit broke it | `git bisect start`, `git bisect bad`, `git bisect good <sha>`, test each checkout | Pro Git 7.10. Needs every commit buildable (section 9) |
| Secret committed | Rotate, then git filter-repo, then force-push with the team notified | Section 10.6 |
| Detached HEAD with commits on it | `git switch -c save-this` | Then merge or cherry-pick where it belongs |

## 13. Command reference

The commands a lead or reviewer actually types, grouped by question.

Where am I and what is dirty:

```
git status
git branch --show-current
git stash list
```

What does history look like:

```
git log --oneline --graph --decorate --all -n 40
git log --oneline origin/main..HEAD
git log --since="2 weeks ago" --author="Name" --oneline
```

What changed:

```
git diff                                  # unstaged
git diff --staged                         # staged
git diff origin/main...HEAD --stat        # branch vs its base
git show --stat <sha>
```

Who did what:

```
git shortlog -sne
git blame -w -C -C -M <path>
git log -S'string' --oneline
git log --follow --oneline -- <path>
```

Branch hygiene:

```
git fetch --prune
git branch --merged origin/main
git branch --no-merged origin/main
git push origin --delete <branch>
```

Releases:

```
git tag -l --sort=-v:refname
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
git describe --tags
```

Undo:

```
git restore --staged <path>
git restore <path>
git commit --amend
git revert <sha>
git reflog
git rebase --abort
git merge --abort
```

## 14. Pro Git chapter map

Section numbers and the page numbers in this project's copy, so a rule can be traced to its source.

| Topic in this file | Pro Git section | Pages in this copy |
|---|---|---|
| Three states, first-time setup | 1.3, 1.6 | |
| Status, staging, ignoring, diff --staged | 2.2 | |
| Log formats, --graph | 2.3 | |
| Undoing: amend, restore | 2.4 | |
| Remotes and pruning | 2.5 | |
| Tagging, annotated vs lightweight | 2.6 | 55 to 57 |
| Branch management, --merged and --no-merged | 3.3 | |
| Branching workflows, long-running vs topic branches | 3.4 | 82 to 84 |
| Remote and tracking branches | 3.5 | |
| Rebasing and its one rule | 3.6 | 99 to 100 |
| Distributed workflows | 5.1 | 129 |
| Commit guidelines | 5.2 | 129 to 131 |
| Maintaining a project, release tagging, git describe, shortlog | 5.3 | |
| Pull requests on GitHub | 6.2 | |
| Revision selection, reflog syntax, two-dot and three-dot ranges | 7.1 | |
| Interactive staging (add --patch) | 7.2 | |
| Stashing | 7.3 | |
| Signing work | 7.4 | |
| Searching (log -S, grep) | 7.5 | |
| Rewriting history (amend, interactive rebase, filter-branch) | 7.6 | |
| Reset demystified | 7.7 | |
| Rerere | 7.9 | |
| Blame and bisect | 7.10 | |
| Configuration, attributes, hooks, enforced policy | 8.1 to 8.4 | hooks at 355 |
| Data recovery with reflog and fsck, removing objects | 10.7 | 441 to 442 |

Blank page cells are sections referenced from the book's table of contents rather than pulled from the PDF text in this pass; fill them in when the section is next consulted.

## Changelog for this file

### 1.0.0, 2026-11-09

- Initial standard: non-negotiables, machine and repository setup, branching, commits, daily loop, pull requests and review, versioning and releases, testing gates, audit protocol, AI agent rules, recovery, command reference, Pro Git map.
