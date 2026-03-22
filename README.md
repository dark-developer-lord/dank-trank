<div align="center">

# ⚡ dank-trank

### From idea to live app in 1 command

[![CI](https://github.com/dark-developer-lord/dank-trank/actions/workflows/ci.yml/badge.svg)](https://github.com/dark-developer-lord/dank-trank/actions)
[![npm version](https://img.shields.io/npm/v/@adas/dank-trank.svg)](https://www.npmjs.com/package/@adas/dank-trank)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Auto-detect your stack → Generate production-ready Docker, Nginx, and CI/CD → Ship.

**Django · FastAPI · Node.js (Express, Next.js, Vite, NestJS, Fastify)**

[Quick Start](#-quick-start) · [Features](#-features) · [What You Get](#-what-you-get) · [Roadmap](#-roadmap) · [Contributing](#contributing)

</div>

---

## Why?

Every project hits the same wall: it works locally, then you spend **hours or days** wiring up Docker, Nginx, CI/CD, health checks, and `.env` files. Boring, error-prone, repeated every time.

**dank-trank** does it in seconds:

```bash
npx @adas/dank-trank init
```

One command. Production-ready infrastructure. Tailored to your stack.

---

## 🚀 Quick Start

```bash
# Run directly (no install needed)
npx @adas/dank-trank init

# Or install globally
npm install -g @adas/dank-trank
dank-trank init
```

### What happens:

1. **Detects** your stack (Django, FastAPI, Node.js) + database dependencies
2. **Generates** 7 production-ready files
3. **Done.** Run `docker compose up --build` and you're live.

### Preview first (dry run):

```bash
dank-trank generate --dry-run
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Auto-detection** | Identifies your stack + database from project files |
| 🐳 **Dockerfile** | Multi-stage build, non-root user, health checks |
| 🐙 **docker-compose.yml** | Full local dev with Nginx, health checks, resource limits |
| 🌐 **nginx.conf** | Production reverse proxy with security headers & WebSocket support |
| ⚡ **GitHub Actions** | CI/CD with test, build, container health, optional GHCR push |
| 📋 **.dockerignore** | Optimized excludes for fast, secure builds |
| 🔐 **.env.example** | Documented env template with all required variables |
| 🚀 **Entrypoint** | Auto-migration & static collection for Django |
| 👀 **Dry run** | Preview what will be generated without writing |
| 💾 **Safe overwrites** | Creates `.bak` backups before overwriting |
| 🏥 **Doctor** | Checks your environment for required tools |
| 🎯 **Database detection** | Detects PostgreSQL, MongoDB, Redis from deps |

---

## 📦 Supported Stacks

| Stack | Sub-frameworks | Database Detection |
|-------|---------------|-------------------|
| **Django** | — | PostgreSQL, Redis |
| **FastAPI** | — | PostgreSQL, MongoDB, Redis |
| **Node.js** | Express, Next.js, Vite, NestJS, Fastify | PostgreSQL, MongoDB, Redis |

---

## ⚡ dank-trank vs Manual Setup

| Task | Manual | dank-trank |
|------|--------|------------|
| Dockerfile with multi-stage build | 30-60 min | **0 sec** |
| docker-compose with health checks | 20-40 min | **0 sec** |
| Nginx reverse proxy + security headers | 15-30 min | **0 sec** |
| GitHub Actions CI/CD | 20-40 min | **0 sec** |
| .dockerignore, .env.example, entrypoint | 10-20 min | **0 sec** |
| **Total** | **2-3 hours** | **~5 seconds** |

---

## 🛠 Commands

```bash
dank-trank inspect              # Detect and display stack info
dank-trank generate             # Generate infrastructure files
dank-trank generate --dry-run   # Preview without writing
dank-trank generate --force     # Overwrite existing files (with backup)
dank-trank init                 # Interactive setup wizard
dank-trank deploy               # Deploy to cloud (coming soon)
dank-trank doctor               # Check environment requirements
```

---

## 📁 What You Get

After running `dank-trank generate` in your project:

```
your-project/
├── Dockerfile                      # Multi-stage, non-root, health check
├── docker-compose.yml              # Nginx + DB, health checks, resource limits
├── nginx.conf                      # Reverse proxy, security headers, timeouts
├── .dockerignore                   # Optimized for fast builds
├── .env.example                    # All required env vars documented
├── docker-entrypoint.sh            # Auto-migration (Django)
└── .github/
    └── workflows/
        └── deploy.yml              # CI/CD with GHCR push
```

### Generated Nginx includes:
- `server_tokens off` — hide Nginx version
- `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` headers
- Proxy timeouts (connect, read, send)
- WebSocket upgrade support (Node.js)

### Generated Dockerfile includes:
- Multi-stage build for minimal image size
- Non-root user execution
- `HEALTHCHECK` directive
- Layer-optimized dependency caching

### Generated docker-compose includes:
- Service health checks with intervals and retries
- `depends_on: condition: service_healthy`
- Resource limits (memory, CPU)
- Named volumes for data persistence

---

## 💡 Example: Django Project

```bash
$ cd my-django-app
$ dank-trank generate

  ⚡ dank-trank
  From idea to live app in 1 command

✔ Detecting project stack
✔ Detected: DJANGO (confidence: 70%)
✔ Generating infrastructure files

Files
  ✔ created  Dockerfile
  ✔ created  docker-compose.yml
  ✔ created  nginx.conf
  ✔ created  .github/workflows/deploy.yml
  ✔ created  .dockerignore
  ✔ created  .env.example
  ✔ created  docker-entrypoint.sh

┌─────────────────────────────────────────────┐
│  dank-trank v2.0.0                          │
│                                             │
│  Stack:     Django                          │
│  Files:     7 generated                     │
│                                             │
│  Next: docker compose up --build            │
└─────────────────────────────────────────────┘
```

---

## 🗺 Roadmap

### v2.0 (Current)
- [x] Auto-detect Django, FastAPI, Node.js (+ NestJS, Fastify)
- [x] Database detection (PostgreSQL, MongoDB, Redis)
- [x] Generate Dockerfile with health checks
- [x] Generate docker-compose with health checks & resource limits
- [x] Generate Nginx with security headers
- [x] .dockerignore, .env.example, entrypoint scripts
- [x] GitHub Actions with GHCR push
- [x] Summary card after generation

### v3.0 (Planned)
- [ ] Deploy to DigitalOcean, Vercel, AWS
- [ ] SSL/TLS automation
- [ ] Kubernetes manifests
- [ ] Monorepo support
- [ ] Plugin system for custom stacks

---

## 🏗 Architecture

```
src/
├── cli/          # CLI entry point (Commander)
├── commands/     # Command handlers (inspect, generate, init, deploy, doctor)
├── detector/     # Stack + database detection
├── generators/   # File generators (7 generators)
├── templates/    # Handlebars-like templates per stack
├── providers/    # Cloud deployment providers (stubs)
├── renderer/     # Micro template engine (zero deps)
├── config/       # Project configuration
└── utils/        # Logger, spinner, file operations
```

---

## Limitations

- **Monorepos** — detects root stack only; workspace packages not individually scanned
- **Custom frameworks** — only detects Django, FastAPI, and popular Node.js frameworks
- **SSL/TLS** — generated Nginx configs are HTTP-only; add TLS in your reverse proxy or load balancer
- **Deploy** — deploy command is a stub; actual deployment support is on the roadmap

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Quick way to contribute:

1. **Add a new stack** — see [docs/adding-a-stack.md](docs/adding-a-stack.md)
2. **Improve templates** — better Dockerfiles, Nginx configs
3. **Add deployment providers** — DigitalOcean, Vercel, AWS
4. **Report bugs** — [open an issue](https://github.com/dark-developer-lord/dank-trank/issues)

---

## Security

See [SECURITY.md](SECURITY.md) for our security policy.

---

## License

MIT © [Adas](https://github.com/dark-developer-lord)

---

<div align="center">

**Built with ❤️ for developers who ship, not configure.**

[⬆ Back to top](#-dank-trank)

</div>