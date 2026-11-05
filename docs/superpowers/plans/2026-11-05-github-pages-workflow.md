# GitHub Pages Deployment Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure automated deployment of `game_modular` to GitHub Pages via GitHub Actions upon push to `master`.

**Architecture:** Create a GitHub Actions workflow `.github/workflows/deploy.yml` with concurrency controls, OIDC/pages permissions, automated pre-deploy sanity validation of JavaScript syntax and JSON integrity, and artifact upload targeting the `game_modular` directory so the application is served cleanly at the root URL of GitHub Pages.

**Tech Stack:** GitHub Actions, GitHub Pages (`actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`), Node.js (for pre-deploy validation).

**Spec:** User request to replace Cloudflare Pages (which is blocked in Belarus without VPN) with GitHub Pages synced to the GitHub repository.

## Global Constraints

- Must deploy the contents of `game_modular/` as the site root so relative assets (`css/styles.css`, `js/*.js`, `data/*.json`) load cleanly.
- Must include automated sanity checks (`node --check` and JSON parsing) during CI to prevent deploying broken code.
- Workflow must trigger on `push` to `master` and support manual runs via `workflow_dispatch`.
- Follow AGENTS.md rules: currency invariant, pre-commit checklist verification, and git commit.

## Review Focus

- Permissions: `pages: write` and `id-token: write` must be explicitly specified for GitHub Pages OIDC.
- Concurrency: `group: "pages"` with `cancel-in-progress: false` to prevent race conditions during deployment.
- Path targeting: `upload-pages-artifact` must point to `./game_modular`.
- YAML syntax: Must be valid YAML with proper indentation and GitHub Actions schema compatibility.
- Documentation: Clear instructions for enabling "GitHub Actions" as the Pages build source in repository settings.

---

### Task 1: Create `.github/workflows/deploy.yml`

**Files:**
- Create: `.github/workflows/deploy.yml`
- Test: Local YAML validation and simulated CI check command

**Interfaces:**
- Produces: GitHub Actions deployment pipeline for GitHub Pages serving `./game_modular`.

- [ ] **Step 1: Write workflow specification test / validation script**
Create a scratch script or verify YAML structure with node/powershell to ensure valid YAML syntax.

- [ ] **Step 2: Create `.github/workflows/deploy.yml`**
Write the workflow with:
  - Name: `Deploy Game to GitHub Pages`
  - Triggers: `push` on branch `master`, `workflow_dispatch`
  - Permissions: `contents: read`, `pages: write`, `id-token: write`
  - Concurrency group `pages`
  - Job `build-and-deploy`:
    - Setup & checkout (`actions/checkout@v4`)
    - Sanity check step: Run `node --check` on all `game_modular/js/*.js` and JSON parse verification on `game_modular/data/*.json`
    - Setup Pages (`actions/configure-pages@v5`)
    - Upload artifact (`actions/upload-pages-artifact@v3` with `path: './game_modular'`)
    - Deploy to Pages (`actions/deploy-pages@v4`)

- [ ] **Step 3: Verify workflow syntax and local execution of CI validation script**
Run the same check commands locally to ensure CI will pass without error.

- [ ] **Step 4: Commit Task 1**
```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions workflow for GitHub Pages deployment"
```

---

### Task 2: Verification, Sanity Checks & Repository Settings Activation Guide

**Files:**
- Verify: Entire repository state and AGENTS.md checklist
- Guide: Instructions for activating GitHub Actions under Repository Settings -> Pages

- [ ] **Step 1: Execute pre-commit verification checklist**
Run PowerShell syntax validation:
```powershell
Get-ChildItem -Path "game_modular/js/*.js" | ForEach-Object { node --check $_.FullName }
Get-ChildItem -Path "game_modular/data/*.json" | ForEach-Object { $null = Get-Content $_.FullName -Raw | ConvertFrom-Json }
```

- [ ] **Step 2: Verify git status and ensure clean working directory**

- [ ] **Step 3: Document steps for user to enable GitHub Actions in repository settings**
Explain that in GitHub repo settings (Settings -> Pages -> Build and deployment -> Source), "GitHub Actions" must be selected.
