# Changelog

All notable changes to this project will be documented in this file.

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
