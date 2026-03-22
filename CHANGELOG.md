# Changelog

All notable changes to this project will be documented in this file.

## [3.0.0] - 2025-07-06

### Added
- **Deploy wizard** (`dt deploy`): interactive wizard to generate and optionally run cloud deployments
  - DigitalOcean App Platform (`.do/app.yaml` + `doctl` integration)
  - Vercel (`vercel.json` + `vercel deploy` integration)
  - AWS App Runner (`apprunner.yaml` + guided ECR/CLI steps)
- **SSL/TLS command** (`dt ssl`): generate SSL configuration files
  - Certbot: `setup-ssl.sh` + `nginx-ssl.conf` with HSTS and auto-renewal cron
  - Caddy: `Caddyfile` with automatic HTTPS
- **Kubernetes manifests** (`dt kube`): generate production-ready k8s manifests
  - Namespace, ConfigMap, Secret template, Deployment, Service, Ingress, HPA
  - `--k8s` flag added to `dt generate` for inline generation
- **Monorepo support**: auto-detect pnpm / npm / lerna workspaces
  - `dt inspect` and `dt generate` display per-package stack detection
  - Root `docker-compose.yml` generated for monorepos with multiple services
- **Plugin system**: extend dank-trank with custom detectors and generators
  - Load plugins from `dank-trank.config.js` in project root
  - Auto-discover `dank-trank-plugin-*` and `@dank-trank/plugin-*` npm packages
  - Example plugin in `examples/plugin-example/`
- Recursive template copy in tsup build (all new template directories copied to dist)
- 30+ new tests covering all new features

## [2.0.0] - 2025-07-05

### Breaking
- Rebranded from `setup-my-startup` to `dank-trank`
- Package: `@adas/dank-trank`, binary: `dank-trank` (alias: `dt`)
- All CLI references and URLs updated

### Added
- Database detection (PostgreSQL, MongoDB, Redis) from project dependencies
- `.dockerignore` generation per stack
- `.env.example` generation with all required variables
- `docker-entrypoint.sh` generation for Django (auto-migrate + collectstatic)
- `HEALTHCHECK` directive in all Dockerfiles
- Health check blocks in all docker-compose services
- Security headers in all Nginx configs (X-Frame-Options, X-Content-Type-Options, etc.)
- `server_tokens off` in all Nginx configs
- Proxy timeouts in Nginx (connect, read, send)
- Resource limits in docker-compose (memory, CPU)
- GHCR image push in GitHub Actions (conditional)
- Curl-based health check with retry in GitHub Actions
- NestJS and Fastify sub-framework detection
- Dynamic version from package.json
- Summary card after generation
- 40+ tests (up from 24)

### Fixed
- Node.js Dockerfile: broken multi-line COPY for lockfiles
- Node.js Dockerfile: `npm prune --production` → `npm ci --omit=dev`
- Django Dockerfile: silent `collectstatic` failure (removed `2>/dev/null || true`)
- Django docker-compose: hardcoded `POSTGRES_PASSWORD` → env variable
- GitHub Actions: replaced `sleep 5` with proper health check retry loop
- GitHub Actions: added cleanup step (always runs)

### Changed
- All templates hardened to production-grade
- Env-based worker count (`WEB_CONCURRENCY`) for Django and FastAPI
- Comprehensive README rewrite with comparison tables

## [0.1.0] - 2026-03-22

### Added
- Initial MVP release
- Auto-detection for Django, FastAPI, and Node.js (Express, Next.js, Vite)
- Dockerfile generation (multi-stage, non-root user)
- docker-compose.yml generation with Nginx reverse proxy
- nginx.conf generation with WebSocket support for Node.js
- GitHub Actions CI/CD workflow generation
- `inspect` command — detect and display stack info
- `generate` command with `--dry-run` and `--force` flags
- `init` command — interactive setup wizard
- `deploy` command — stub with provider architecture (DigitalOcean, Vercel, AWS)
- `doctor` command — environment health check
- Safe file overwrites with automatic `.bak` backups
- Micro template rendering engine (no external dependencies)
- 24 unit and integration tests
