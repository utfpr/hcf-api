---
name: pr-review
description: >-
  Reviews a GitHub pull request for this API (correctness, security, migrations,
  tests, herbarium-domain contracts) and, only after explicit user confirmation,
  posts inline diff comments and submits a GitHub PR review (`REQUEST_CHANGES`,
  `COMMENT`, or `APPROVE`) with no review body. Use when the user names this
  skill or asks to review a GitHub PR, PR URL/number, or gh pr review.
disable-model-invocation: true
---

# HCF API PR Review

Explicit invoke only. GitHub PRs only. Non-mutating until Phase 6.

Do not: checkout, push, merge, `gh pr comment`, yarn/tsc/test, or fix code. Do not use `Task` or spawn subagents. `gh pr review` is Phase 6 only, after Yes.

Domain details: [CHECKLIST.md](CHECKLIST.md).

## Inputs

- PR URL or number (`#42`, `42`), or the PR for the current branch (`gh pr view`).
- Optional path filter: review only those files.

If no PR resolves, ask for a number/URL. Do not review a local dirty tree.

## Phase 1 — Resolve

```bash
gh pr view <n> --json number,title,body,author,baseRefName,headRefName,headRefOid,isDraft,labels,url,files
gh pr checks <n>
gh api "repos/{owner}/{repo}/pulls/{n}/comments"
```

Resolve `{owner}/{repo}` from `gh repo view --json nameWithOwner`.

Also: `gh pr diff <n>`.

- Base branch = PR `baseRefName` (this repo: often `development`). Never hardcode `main`.
- Language: match PR title/body (EN vs PT). If mixed, match the title.
- `gh pr view --comments` does **not** list inline comments; always load `GET .../pulls/{n}/comments`.
- Skip nits already raised on the same path/line.

## Phase 2 — Evidence

- Canonical patch: `gh pr diff`.
- Read each in-scope changed file from disk.
- If local `HEAD` ≠ `headRefOid`: warn once. Diff is source of truth. Cite local `file:line` only when content matches the PR. Never `git checkout` / `git switch`.

Diff is context. Findings need a real path and line (file read or explicit hunk in the patch).

Empty diff: output `No changes detected to review.` and stop.

## Phase 3 — Lenses

Select only matching lenses:

| Lens | Paths |
| --- | --- |
| HTTP / Express | `src/routes`, `src/controllers`, `src/application`, `src/library/http`, validators, middlewares |
| Domain / use cases | `src/domain`, `src/application` |
| Persistence | `src/models`, `src/infrastructure`, Knex adapters, `src/database/migration` |
| Auth / tenancy | tokens middleware, user controllers, JWT/bcrypt, `src/library/auth`, `src/infrastructure/auth` |
| Herbarium | `src/herbarium`, Darwin Core, tombos, specieslink, reflora |
| Reports | `src/reports`, EJS/React templates |
| Infra / ops | `ansible`, `compose*.yml`, `.github/workflows`, Docker |
| Tests | `test/`, `*.test.*`, `*.spec.*` |

## Phase 4 — Review

Not a persona panel. Apply [CHECKLIST.md](CHECKLIST.md) for selected lenses.

Read the matching `.cursor/rules/*.mdc` before reviewing those files (do not copy drifted names already in the tree):

| When the diff… | Rule |
| --- | --- |
| Touches `src/domain`, `src/application`, `src/infrastructure`, `src/library`, or `src/factory` | `.cursor/rules/hexagonal-layers.mdc` — folder map, import graph, use cases in domain, dual stack |
| Touches hexagonal entities, `Either`, or `static create` | `.cursor/rules/domain-entities.mdc` |
| Adds or changes a `*Collection` port or `*CollectionKnexAdapter` | `.cursor/rules/collection-adapters.mdc` — map columns then `Entity.create`; new ports return entities |
| Adds or changes a controller, middleware, or `library/http` | `.cursor/rules/http-adapters.mdc` — parse, one collaborator, `instanceof`; no all-`left` → 500 |
| Adds or renames a controller, use case, or its test | `.cursor/rules/type-and-file-names.mdc` — Portuguese 3rd-person verbs; leftover old files after a rename |
| Adds or changes a `*UseCase` (`execute`, collaborators, nesting) | `.cursor/rules/use-case-boundaries.mdc` — one intention; ports only; no nested or pass-through catalog use cases |
| Adds an exported collaborator (injected, stateful, port, vendor wrap) | `.cursor/rules/prefer-classes-over-functions.mdc` — class unless it is a pure transform or `routes` / `createX` |
| Adds or relocates an error class | `.cursor/rules/error-classes-own-files.mdc` — one public error type per file under the layer’s `error/` |

Do not bulk-load every rule. Choose by changed paths and symbols. Always read `hexagonal-layers.mdc` when any hex folder is in the diff.

### Blocker bar

Block only what the diff introduces or clearly worsens (correctness, security, data loss, broken contract). New code that violates the Cursor rules above is a broken contract: infinitive type names, kebab-case hex folders, use case in `application`, Knex/Express in domain, new pass-through `Lista*`/`Busca*` use case, nested use cases, new collection port returning raw `Attributes`, adapter that skips `Entity.create`, all `left` → 500, collaborator as a standalone function, error class colocated with the type that throws it, entity constructed outside `create`.

CI failure on the PR head is a blocker unless the user says to ignore CI.

Suggestions: real improvements, optional hardening, hypotheticals, pre-existing issues not worsened by the PR, extra tests for low-risk behavior.

Same root cause → one finding. Do not nits on ESLint/format (CI runs `yarn lint`). Do not emit notes, praise, or non-actionable asides.

Chat verdict: `REQUEST CHANGES` if any blocker; else `COMMENT` if any suggestion; else `APPROVE`. After Yes in Phase 6, submit the same event with `gh pr review`.

### Code examples

When a finding is about a type, call shape, error class, entity construction, HTTP mapping, SQL/index, or a concrete alternative, attach a short fenced snippet of the **desired** shape (or a minimal contrast). Same snippet in the chat report and in the GitHub inline body.

Skip the snippet only when there is no code locus: CI-only, missing file with nothing to show, or a process issue.

Keep it small (about 5–15 lines). Show the contract, not a full rewrite of the PR file. Do not paste large existing files.

## Phase 5 — Chat report, then stop

Emit exactly this structure. Portuguese: translate headings per the map below; keep sections.

```markdown
# PR review: #<number> — <title>

**Verdict:** REQUEST CHANGES | COMMENT | APPROVE
**CI:** <summary>
**Scope:** <n> files; lenses: <list>
**HEAD match:** ok | diverged (warn)

## Summary
<2–4 sentences>

## Blockers
- <issue> — `path:line`
  Why: <evidence>

  ```ts
  // desired shape (omit fence when no code locus)
  ```

## Suggestions
- <issue> — `path:line`
  Why: <rationale>

  ```ts
  // desired shape (omit fence when no code locus)
  ```
```

Empty sections: `None.`

Do not add a Notes section.

Then list:

- **Postable:** blockers + suggestions with `path` + `line` on the PR diff.
- **Not postable:** CI-only, missing line, line not in the diff.

Ask: post these N inline comments and submit the GitHub review (`REQUEST CHANGES` / `COMMENT` / `APPROVE`)? Yes / No / Edit first.

Do not POST in this phase.

### PT headings

| EN | PT |
| --- | --- |
| Verdict | Veredito |
| Scope | Escopo |
| HEAD match | HEAD local |
| Summary | Resumo |
| Blockers | Bloqueios |
| Suggestions | Sugestões |
| REQUEST CHANGES | SOLICITAR ALTERAÇÕES |
| COMMENT | COMENTÁRIO |
| APPROVE | APROVAR |

## Phase 6 — Inline comments + review event (after Yes)

For each confirmed postable finding, post an inline comment:

```bash
gh api "repos/{owner}/{repo}/pulls/{number}/comments" \
  --method POST \
  -f body="<why>" \
  -f commit_id="<headRefOid>" \
  -f path="<repo-relative path>" \
  -F line=<line> \
  -f side=RIGHT
```

- `commit_id` = PR `headRefOid`, not local HEAD.
- Multi-line hunk: `-F start_line=` and `-F line=` (end).
- Comment body: finding only, same language as the report: why, then the same fenced example when the chat item has one. Do **not** prefix with `Blocker:` / `Suggestion:` / `Bloqueio:` / `Sugestão:` (or any severity label).
- Do not paste the full chat report.
- 422 (line not in diff): skip, report in chat, continue.
- Zero postable comments: skip the inline POSTs and still submit the review event below.
- User says no: no GitHub writes.

Then submit **one** review with **no summary text**. Findings live on the inline comments. Do not write a review body. Use `--body ""` so `gh` does not prompt for one (the API requires a body field for `--request-changes` and `--comment`).

```bash
# REQUEST CHANGES (any blocker, including CI-only)
gh pr review <n> --repo {owner}/{repo} --request-changes --body ""

# COMMENT (suggestions only)
gh pr review <n> --repo {owner}/{repo} --comment --body ""

# APPROVE (no blockers, no suggestions)
gh pr review <n> --repo {owner}/{repo} --approve
```

- Map chat verdict → flag: `REQUEST CHANGES` → `--request-changes`; `COMMENT` → `--comment`; `APPROVE` → `--approve`.
- Never `gh pr comment`. Never `gh pr merge`.

## Constraints

- Do not call `/review`.
- Do not use `Task` or spawn subagents.
- Do not leave the repository modified.
- Do not run deploy commands or Ansible playbooks.
- Do not prepare or run production database write commands.
- Do not run long test suites unless the PR specifically changes test infrastructure and the command is clearly bounded.
