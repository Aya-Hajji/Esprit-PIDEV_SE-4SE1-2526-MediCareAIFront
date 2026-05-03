# CI/CD Pipeline Documentation

This document describes the continuous integration and deployment pipeline for the MediCare AI Frontend.

## Overview

The pipeline automates the following processes:
- ✅ Code testing and quality checks
- ✅ Docker image building and pushing
- ✅ Security scanning
- ✅ Automated deployment to staging and production
- ✅ Release management

## Workflows

### 1. CI/CD Pipeline (`ci-cd.yml`)

**Triggers**: `push` to main/develop, `pull_request`, manual trigger

**Jobs**:

#### Job 1: Test & Quality Check
- **Node.js Setup**: v21
- **Tasks**:
  - Install dependencies
  - Run ESLint (if available)
  - Run unit tests with coverage
  - Upload coverage to Codecov
  - Archive test results

**Artifacts**: Test results and coverage reports

#### Job 2: Build Application
- **Dependency**: Requires `test` job to pass
- **Tasks**:
  - Install dependencies
  - Build Angular application
  - Create production-ready distribution

**Artifacts**: Build artifacts (dist/)

#### Job 3: Build & Push Docker Image
- **Dependency**: Requires `build` job to pass
- **Condition**: Only runs on `push` events
- **Tasks**:
  - Set up Docker Buildx
  - Log in to GitHub Container Registry
  - Build multi-platform Docker image
  - Push to registry with automatic tagging

**Tags Generated**:
- `branch-name` (from branch)
- `semver` version tags
- `latest` (for main branch)
- `sha-shortcode` (from commit)

#### Job 4: Security Scan
- **Tasks**:
  - Run npm audit
  - Optional: Snyk dependency check

#### Job 5: Deploy to Staging
- **Dependency**: Requires `docker-build` job
- **Condition**: Only on `develop` branch push
- **Status**: Awaits manual deployment commands

#### Job 6: Deploy to Production
- **Dependency**: Requires `docker-build` job
- **Condition**: Only on `main` branch push
- **Status**: Awaits manual deployment commands

---

### 2. Testing Workflow (`testing.yml`)

**Triggers**: `push`, `pull_request`, Daily schedule (2 AM UTC)

**Jobs**:

#### Unit Tests (Matrix Strategy)
- Tests against Node.js 20 and 21
- Coverage reports to Codecov
- Runs with Chrome headless browser

#### E2E Tests
- Placeholder for end-to-end tests
- Can be integrated with Cypress, Playwright, etc.

#### Lighthouse Audit
- Performance auditing
- Accessibility checks
- SEO analysis
- Best practices review

#### Coverage Report
- Comments PR with coverage metrics
- Tracks coverage trends

---

### 3. Code Quality Workflow (`quality.yml`)

**Triggers**: `push`, `pull_request`

**Jobs**:

#### SonarCloud Analysis
- Static code analysis
- Code smells detection
- Security hotspots
- Bug detection

**Configuration**:
- Project Key: `MediCareAI_Frontend`
- Exclusions: `*.spec.ts`, `*.module.ts`
- Coverage: TypeScript/JavaScript

#### ESLint Analysis
- Code style checking
- Best practices validation
- Continues on error

#### TypeScript Check
- Type safety verification
- Compilation check

#### Dependency Check
- Outdated packages check
- Security vulnerabilities scan

---

### 4. Release Workflow (`release.yml`)

**Triggers**: `push` to main, version tags, manual trigger

**Jobs**:

#### Build & Release
- Full test suite execution
- Application build
- Docker image creation and push
- GitHub Release creation (for tags)
- Artifact archival

**Automatic Release Tasks**:
- Generate release notes
- Attach Docker image reference
- Archive distributable artifacts

---

## Environment Variables

### Global
```yaml
NODE_VERSION: '21'
REGISTRY: ghcr.io
IMAGE_NAME: ${{ github.repository }}
```

## Secrets Required

To enable all features, configure these secrets in GitHub:

```
GITHUB_TOKEN          # Automatically available
SNYK_TOKEN           # Optional: For Snyk security scanning
SONAR_TOKEN          # Optional: For SonarCloud analysis
DOCKER_USERNAME      # Optional: Docker Hub push
DOCKER_PASSWORD      # Optional: Docker Hub credentials
```

### GitHub Secrets Configuration

1. Navigate to: `Settings` → `Secrets and variables` → `Actions`
2. Click `New repository secret`
3. Add the following secrets:

```
Name: SNYK_TOKEN
Value: [Get from snyk.io dashboard]

Name: SONAR_TOKEN
Value: [Get from sonarcloud.io dashboard]
```

---

## Workflow Status Badges

Add these badges to your README.md:

```markdown
[![CI/CD Pipeline](https://github.com/Brahem-Ahmed/Esprit-PIDEV_SE-4SE1-2526-MediCareAIFront/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Brahem-Ahmed/Esprit-PIDEV_SE-4SE1-2526-MediCareAIFront/actions/workflows/ci-cd.yml)

[![Testing](https://github.com/Brahem-Ahmed/Esprit-PIDEV_SE-4SE1-2526-MediCareAIFront/actions/workflows/testing.yml/badge.svg)](https://github.com/Brahem-Ahmed/Esprit-PIDEV_SE-4SE1-2526-MediCareAIFront/actions/workflows/testing.yml)

[![Code Quality](https://github.com/Brahem-Ahmed/Esprit-PIDEV_SE-4SE1-2526-MediCareAIFront/actions/workflows/quality.yml/badge.svg)](https://github.com/Brahem-Ahmed/Esprit-PIDEV_SE-4SE1-2526-MediCareAIFront/actions/workflows/quality.yml)
```

---

## Docker Image Registry

### GitHub Container Registry (GHCR)

Images are automatically pushed to:
```
ghcr.io/brahem-ahmed/esprit-pidev_se-4se1-2526-medicareaifront:TAG
```

### Available Tags

- `latest` - Latest main branch build
- `develop` - Latest develop branch build
- `v1.0.0` - Version-specific tag
- `main-abc123d` - Branch + commit SHA

### Pulling Images

```bash
# Latest version
docker pull ghcr.io/brahem-ahmed/esprit-pidev_se-4se1-2526-medicareaifront:latest

# Specific version
docker pull ghcr.io/brahem-ahmed/esprit-pidev_se-4se1-2526-medicareaifront:v1.0.0

# Specific branch
docker pull ghcr.io/brahem-ahmed/esprit-pidev_se-4se1-2526-medicareaifront:develop
```

---

## Deployment Instructions

### Manual Deployment to Staging

1. Ensure all tests pass on `develop` branch
2. Workflow automatically triggers deployment job
3. Add your deployment commands in `deploy-staging` job

Example:
```bash
kubectl apply -f k8s/staging/ -n staging
# or
docker pull IMAGE:develop
docker-compose up -d
```

### Manual Deployment to Production

1. Merge to `main` branch
2. Create a version tag: `git tag -a v1.0.0 -m "Release 1.0.0"`
3. Push tag: `git push origin v1.0.0`
4. Workflow automatically triggers deployment job
5. Add your deployment commands in `deploy-production` job

---

## Branch Protection Rules

Recommended branch protection configuration:

### For `main` branch:
- ✅ Require pull request reviews (2 reviewers)
- ✅ Dismiss stale pull request approvals
- ✅ Require status checks to pass before merging:
  - `test / Test & Quality Check`
  - `build / Build Application`
  - `security / Security Scan`

### For `develop` branch:
- ✅ Require pull request reviews (1 reviewer)
- ✅ Require status checks to pass

---

## Monitoring & Troubleshooting

### View Workflow Runs

1. Go to repository → `Actions`
2. Click on specific workflow
3. View job logs in detail

### Common Issues

#### Docker Push Fails
```
Error: unauthorized: authentication required
```
**Solution**: Verify GitHub token has `write:packages` permission

#### Tests Fail Intermittently
```
Chrome Headless timeout
```
**Solution**: Increase timeout or check system resources

#### Build Takes Too Long
**Optimization**:
- Use cache in Docker builds
- Use `npm ci` instead of `npm install`
- Parallelize independent jobs

---

## Performance Optimization

### Cache Strategy

```yaml
# Node.js cache
cache: 'npm'

# Docker cache
cache-from: type=gha
cache-to: type=gha,mode=max
```

### Concurrent Jobs

Jobs run in parallel unless they have `needs` dependencies:
- `test`, `security` run together
- `build` waits for `test`
- `docker-build` waits for `build`

---

## Extending the Pipeline

### Adding New Workflow

1. Create new file in `.github/workflows/`
2. Define triggers and jobs
3. Reference in main CI/CD documentation

Example: Adding Percy visual testing
```yaml
- name: Percy Screenshots
  uses: percy/cli-github-action@v0
  with:
    static: --serve dist/ --port 8080
```

### Integrating with External Services

- **Slack Notifications**: Use `slackapi/slack-github-action`
- **Email Alerts**: Use `dawidd6/action-send-mail`
- **Discord Webhooks**: Use `sarisia/actions-status-discord`

---

## Best Practices

1. **Keep workflows lean** - Use separate workflows for different concerns
2. **Cache aggressively** - Reduce dependency installation time
3. **Fail fast** - Run quick checks before expensive ones
4. **Use matrixes** - Test against multiple Node versions
5. **Monitor logs** - Review workflow runs regularly
6. **Update actions** - Keep GitHub Actions up to date
7. **Secure secrets** - Use GitHub Secrets for sensitive data
8. **Document changes** - Update this file when modifying workflows

---

## Support & Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker GitHub Actions](https://github.com/docker/build-push-action)
- [SonarCloud Integration](https://docs.sonarcloud.io/getting-started/github/)
- [Codecov Documentation](https://docs.codecov.com/docs)
