# GitHub Repository Configuration Implementation

This document outlines the implementation details for configuring the GitHub repository according to our branch management strategy.

## Repository Settings

These settings need to be configured in the GitHub repository settings:

```yaml
repository:
  allow_squash_merge: true
  allow_merge_commit: false
  allow_rebase_merge: true
  delete_branch_on_merge: true
```

## Branch Protection Rules

### Main Branch Protection

```yaml
branches:
  main:
    required_status_checks:
      strict: true
      checks:
        - "TypeScript Build"
        - "Unit Tests"
        - "Integration Tests"
        - "ESLint"
        - "Code Coverage"
    required_pull_request_reviews:
      required_approving_review_count: 1
      dismiss_stale_reviews: true
    enforce_admins: true
    required_linear_history: true
    allow_force_pushes: false
    allow_deletions: false
```

### Develop Branch Protection

```yaml
branches:
  develop:
    required_status_checks:
      strict: true
      checks:
        - "TypeScript Build"
        - "Unit Tests"
        - "Integration Tests"
        - "ESLint"
        - "Code Coverage"
    required_pull_request_reviews:
      required_approving_review_count: 1
      dismiss_stale_reviews: true
    enforce_admins: true
    required_linear_history: false
    allow_force_pushes: false
    allow_deletions: false
```

## GitHub Actions Workflows

### CI Workflow (.github/workflows/ci.yml)

```yaml
name: CI

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main, develop ]

jobs:
  build:
    name: TypeScript Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build

  lint:
    name: ESLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit
      
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:integration

  coverage:
    name: Code Coverage
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:coverage
      - name: Check coverage threshold
        run: |
          COVERAGE=$(npm run test:coverage | grep "All files" | awk '{print $4}' | sed 's/%//')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Code coverage is below 80%"
            exit 1
          fi
```

### Stale Branch Cleanup (.github/workflows/stale.yml)

```yaml
name: Stale Branch Cleanup

on:
  schedule:
    - cron: '0 0 * * 0'  # Run weekly at midnight on Sunday

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Delete merged branches
        uses: fancy-branch-cleanup/action@v1
        with:
          retain_days: 1
          
      - name: Flag stale branches
        uses: actions/stale@v3
        with:
          days-before-stale: 60
          stale-branch-message: 'This branch has been marked as stale due to 60 days of inactivity'
          days-before-delete: 7
          delete-branch-message: 'This stale branch will be deleted in 7 days'
```

## Implementation Steps

1. Configure repository settings through GitHub UI:
   - Enable squash merging
   - Disable merge commits
   - Enable branch auto-deletion

2. Configure branch protection rules:
   - Set up `main` branch protection
   - Set up `develop` branch protection
   - Configure required status checks

3. Create GitHub Actions workflows:
   - Create `.github/workflows` directory
   - Add CI workflow file
   - Add stale branch cleanup workflow file

4. Verify configurations:
   - Test PR creation and merging
   - Verify status checks are working
   - Test branch cleanup automation
   